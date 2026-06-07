import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, ScreenShare, ShieldAlert, VideoOff, Play, Pause, Square, 
  Download, Loader2, Volume2, VolumeX, Mic, MicOff, RefreshCw, 
  Settings, HelpCircle, AlertCircle, Sparkles, CheckCircle, Monitor, 
  Camera, Move, Maximize2, Layers, Disc, Circle, Film
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function VideoRecorder() {
  const { language } = useLanguage();
  
  // Applet Log Trace
  useEffect(() => {
    logToolUsage('video-recorder');
  }, []);

  // Media Capture states
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [recorderState, setRecorderState] = useState<'idle' | 'countdown' | 'recording' | 'paused' | 'complete'>('idle');
  const [countdown, setCountdown] = useState(3);
  
  // Devices lists
  const [camDevices, setCamDevices] = useState<DeviceOption[]>([]);
  const [micDevices, setMicDevices] = useState<DeviceOption[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');

  // Preference switches
  const [recordScreen, setRecordScreen] = useState(true);
  const [recordCam, setRecordCam] = useState(true);
  const [recordMic, setRecordMic] = useState(true);
  const [camShape, setCamShape] = useState<'circle' | 'square'>('circle');
  const [camSize, setCamSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [camPosition, setCamPosition] = useState<'bottom-left' | 'bottom-right' | 'top-right' | 'top-left'>('bottom-left');

  // Interactive Level indicators
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  // Result parameters
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlobSize, setRecordedBlobSize] = useState<number>(0);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  // HTML Audio level node references
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioVolumeTimerRef = useRef<number | null>(null);

  // Video playback & Compositing references
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Enumerating media capture nodes
  useEffect(() => {
    enumerateInputs();
    return () => {
      terminateAllSTreams();
      if (audioVolumeTimerRef.current) cancelAnimationFrame(audioVolumeTimerRef.current);
    };
  }, []);

  const enumerateInputs = async () => {
    try {
      // Trigger prompt permission initially to discover labels cleanly
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((s) => {
        // Stop discovery stream instantly
        s.getTracks().forEach(t => t.stop());
      }).catch(() => {
        // Fallback gracefully if hardware is busy or absent
      });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoIn = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));
      const audioIn = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));

      setCamDevices(videoIn);
      setMicDevices(audioIn);

      if (videoIn.length > 0) setSelectedCam(videoIn[0].deviceId);
      if (audioIn.length > 0) setSelectedMic(audioIn[0].deviceId);

    } catch (err: any) {
      console.warn("Media device enumeration limited:", err.message);
    }
  };

  const terminateAllSTreams = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // Launch Mic Voltmeter
  const startMicVoltmeter = (stream: MediaStream) => {
    if (audioVolumeTimerRef.current) cancelAnimationFrame(audioVolumeTimerRef.current);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!audioAnalyserRef.current) return;
        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.floor(avg * 1.6)));
        audioVolumeTimerRef.current = requestAnimationFrame(checkVolume);
      };

      audioVolumeTimerRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn("Could not start Web Audio voltmeter:", e);
    }
  };

  // Turn Webcam Camera feed preview ON
  const activateWebcam = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    try {
      setErrorHeader(null);
      const constraints: MediaStreamConstraints = {
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: recordMic ? (selectedMic ? { deviceId: { exact: selectedMic } } : true) : false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (camVideoRef.current) {
        camVideoRef.current.srcObject = stream;
        camVideoRef.current.play().catch(() => {});
      }

      // If mic exists in stream, start level visualizer
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        startMicVoltmeter(stream);
      }
    } catch (err: any) {
      setErrorHeader(`Webcam / Mic access denied or unavailable: ${err.message}`);
      setRecordCam(false);
    }
  };

  const toggleCamFeed = () => {
    if (recordCam) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setRecordCam(false);
    } else {
      setRecordCam(true);
      activateWebcam();
    }
  };

  useEffect(() => {
    if (recordCam) {
      activateWebcam();
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setAudioLevel(0);
    }
  }, [recordCam, selectedCam, selectedMic, recordMic]);

  // Picture in Picture Popout Utility (OS-level overlay)
  const triggerPictureInPicture = async () => {
    if (!camVideoRef.current) {
      setErrorHeader("Webcam visual display must be active to trigger Picture-in-Picture.");
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await camVideoRef.current.requestPictureInPicture();
      }
    } catch (err: any) {
      setErrorHeader(`PIP API unsupported or blocked: ${err.message}. Choose canvas composition below instead.`);
    }
  };

  // Initiate capture state loop
  const triggerRecordingSequence = async () => {
    setErrorHeader(null);
    setRecordedBlobUrl(null);
    
    // Validate that we selected at least screen or camera
    if (!recordScreen && !recordCam) {
      setErrorHeader("Please specify at least active Screen sharing, Camera recording, or both.");
      return;
    }

    try {
      let captureScreenStream: MediaStream | null = null;
      if (recordScreen) {
        // Start Display capturing
        captureScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        setScreenStream(captureScreenStream);

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = captureScreenStream;
          screenVideoRef.current.play().catch(() => {});
        }

        // Listen for screen sharing stop done by user via browser built-in banner
        captureScreenStream.getVideoTracks()[0].onended = () => {
          stopRecordingWorkflow();
        };
      }

      // Enter countdown sequence
      setRecorderState('countdown');
      setCountdown(3);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Launch final Media Capture core stream
            commenceRecordingCore(captureScreenStream);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      setErrorHeader(`Screen Share authorization rejected: ${err.message}`);
      setRecorderState('idle');
    }
  };

  const commenceRecordingCore = (activeScreenStream: MediaStream | null) => {
    try {
      setRecorderState('recording');
      setRecordingSeconds(0);
      setRecordedBytes(0);
      recordedChunksRef.current = [];

      // Create a canvas stream destination for composition of screen + camera bubble
      const canvas = renderCanvasRef.current;
      if (!canvas) throw new Error("Composition canvas module disconnected.");

      // Set target HD recording resolution
      const width = 1285;
      const height = 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Composition 2D context failed.");

      // Frame compositor loop
      const composeFrames = () => {
        if (!ctx) return;
        ctx.fillStyle = '#07070a';
        ctx.fillRect(0, 0, width, height);

        // 1. Draw screen sharing feed
        if (recordScreen && screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
          ctx.drawImage(screenVideoRef.current, 0, 0, width, height);
        } else {
          // If camera capture ONLY, draw carbon visual background
          ctx.font = 'bold 36px monospace';
          ctx.fillStyle = '#1e293b';
          ctx.textAlign = 'center';
          ctx.fillText('APEX VIDEO FEED STREAMING', width / 2, height / 2 - 20);
        }

        // 2. Overlay camera circle bubble
        if (recordCam && camVideoRef.current && camVideoRef.current.readyState >= 2) {
          ctx.save();
          
          // Define bubble dimensions
          let radius = 90;
          if (camSize === 'sm') radius = 60;
          if (camSize === 'lg') radius = 120;

          // Compute margins
          let cx = radius + 30;
          let cy = height - radius - 30;

          if (camPosition === 'bottom-right') {
            cx = width - radius - 30;
          } else if (camPosition === 'top-right') {
            cx = width - radius - 30;
            cy = radius + 30;
          } else if (camPosition === 'top-left') {
            cx = radius + 30;
            cy = radius + 30;
          }

          if (camShape === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
          } else {
            // Square bubble Clip
            ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
            ctx.clip();
          }

          // Draw the camera output frame mirrored for zoom look
          const boxSize = radius * 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(-1, 1);
          ctx.drawImage(camVideoRef.current, -radius, -radius, boxSize, boxSize);
          ctx.restore();

          // Border outlines
          ctx.restore();
          ctx.beginPath();
          if (camShape === 'circle') {
            ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
          } else {
            ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
          }
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Keep render loop spinning while state is recording
        animationFrameRef.current = requestAnimationFrame(composeFrames);
      };

      // Launch the compositor loop sequence
      composeFrames();

      // Extract visual stream to package
      const composedVisualStream = canvas.captureStream(30); // 30 FPS stream

      // Audio setup utilizing Web Audio API mixing context
      const mixingAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioTracksForOutput: MediaStreamTrack[] = [];

      // Connect screen systems audio if available
      if (activeScreenStream && activeScreenStream.getAudioTracks().length > 0) {
        const screenNode = mixingAudioContext.createMediaStreamSource(activeScreenStream);
        const screenDest = mixingAudioContext.createMediaStreamDestination();
        screenNode.connect(screenDest);
        if (screenDest.stream.getAudioTracks()[0]) {
          audioTracksForOutput.push(screenDest.stream.getAudioTracks()[0]);
        }
      }

      // Connect hardware microphone input if available
      if (cameraStream && cameraStream.getAudioTracks().length > 0) {
        const micNode = mixingAudioContext.createMediaStreamSource(cameraStream);
        const micDest = mixingAudioContext.createMediaStreamDestination();
        micNode.connect(micDest);
        if (micDest.stream.getAudioTracks()[0]) {
          audioTracksForOutput.push(micDest.stream.getAudioTracks()[0]);
        }
      }

      // Assembly combined audio/video package
      const finalRecordingStream = new MediaStream();
      
      // Load video tracks from canvas
      composedVisualStream.getVideoTracks().forEach(t => finalRecordingStream.addTrack(t));

      // Append tracks
      if (audioTracksForOutput.length > 0) {
        // Compose mixed audio signals if multiple exist
        const mixDestination = mixingAudioContext.createMediaStreamDestination();
        
        if (activeScreenStream && activeScreenStream.getAudioTracks().length > 0) {
          const s1 = mixingAudioContext.createMediaStreamSource(activeScreenStream);
          s1.connect(mixDestination);
        }
        if (cameraStream && cameraStream.getAudioTracks().length > 0) {
          const s2 = mixingAudioContext.createMediaStreamSource(cameraStream);
          s2.connect(mixDestination);
        }

        mixDestination.stream.getAudioTracks().forEach(t => finalRecordingStream.addTrack(t));
      }

      // Support universal browsers mime options
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(finalRecordingStream, {
        mimeType: selectedMime || undefined,
        videoBitsPerSecond: 2500000 // 2.5 Mbps crisp HD
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          setRecordedBytes(b => b + event.data.size);
        }
      };

      recorder.onstop = () => {
        const compositeBlob = new Blob(recordedChunksRef.current, { type: selectedMime || 'video/webm' });
        const videoURL = URL.createObjectURL(compositeBlob);

        setRecordedBlobUrl(videoURL);
        setRecordedBlobSize(compositeBlob.size);
        setRecordedDuration(recordingSeconds || 1); // Fallback offset
        setRecorderState('complete');

        // Cleanup resources
        terminateAllSTreams();
      };

      // Start recording loops
      recorder.start(1000); // chunk slices every second
      mediaRecorderRef.current = recorder;

      // Start recording timer monitor
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);

    } catch (err: any) {
      setErrorHeader(`MediaRecorder initialize failure: ${err.message}`);
      setRecorderState('idle');
      terminateAllSTreams();
    }
  };

  const pauseRecordingWorkflow = () => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecorderState('paused');
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const resumeRecordingWorkflow = () => {
    if (mediaRecorderRef.current && recorderState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecorderState('recording');
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    }
  };

  const stopRecordingWorkflow = () => {
    if (mediaRecorderRef.current && (recorderState === 'recording' || recorderState === 'paused')) {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTimer = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = (secs % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-1 max-w-7xl mx-auto space-y-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[9px] uppercase tracking-widest font-bold">
              Media Lab v2.5
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <h1 className="font-heading text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Loom-Style Screen & Camera Recorder
          </h1>
          <p className="font-sans text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
            Record high-definition video assets directly and privately in your sandbox. Superimpose active webcam bubbles onto screen captures, mix multi-device hardware micro-tracks in real-time, and download lossless WebM reels instantly.
          </p>
        </div>

        {recorderState === 'complete' && (
          <button
            onClick={() => setRecorderState('idle')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RECORD NEW</span>
          </button>
        )}
      </div>

      {errorHeader && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-100 rounded-lg text-xs leading-relaxed flex gap-2.5 items-start max-w-4xl">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[10px] text-red-400 mb-0.5">Capture Notification</span>
            {errorHeader}
          </div>
        </div>
      )}

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Hardware configuration console */}
        <div className="lg:col-span-4 space-y-6">
          
          {recorderState === 'idle' ? (
            <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-5">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                Capture Sources
              </h2>

              <div className="space-y-4 text-xs text-zinc-305">
                
                {/* Screen Share Toggle */}
                <div className="p-3 rounded bg-[#07070a] border border-zinc-900 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-zinc-200">Record Screen Feed</span>
                    <span className="text-[10px] text-zinc-500 font-mono">BROWSERS, SHELLS, OR DIRECT DESKTOP</span>
                  </div>
                  <button 
                    onClick={() => setRecordScreen(!recordScreen)}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      recordScreen ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                      recordScreen ? 'left-4.5' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Webcam Toggle */}
                <div className="p-3 rounded bg-[#07070a] border border-zinc-900 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-zinc-200">Record Webcam Camera</span>
                    <span className="text-[10px] text-zinc-500 font-mono">ACTIVE PICTURE OVERLAY STREAM</span>
                  </div>
                  <button 
                    onClick={toggleCamFeed}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      recordCam ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                      recordCam ? 'left-4.5' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Microphone Toggle */}
                <div className="p-3 rounded bg-[#07070a] border border-zinc-900 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold block text-zinc-200">Record Microphone Input</span>
                    <span className="text-[10px] text-zinc-500 font-mono">MIX CAPTURES FROM AUDIO CARDS</span>
                  </div>
                  <button 
                    onClick={() => setRecordMic(!recordMic)}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      recordMic ? 'bg-cyan-500' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all ${
                      recordMic ? 'left-4.5' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Cam selection */}
                {recordCam && camDevices.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Camera Device</label>
                    <select
                      value={selectedCam}
                      onChange={(e) => setSelectedCam(e.target.value)}
                      className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      {camDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mic selection */}
                {recordMic && micDevices.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Microphone Device</label>
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      {micDevices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Initiate Record Button */}
                <button
                  onClick={triggerRecordingSequence}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-550 active:scale-98 text-white rounded font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-3"
                >
                  <Disc className="w-4 h-4 animate-pulse text-red-400" />
                  <span>START STREAM CAPTURE</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active recording parameters stats overview */
            <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2 border-b border-zinc-900 pb-2">
                <Disc className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                Capture Pipeline Active
              </h2>

              <div className="space-y-3">
                <div className="bg-[#07070a] p-3 rounded.lg border border-zinc-900 font-mono text-center space-y-1">
                  <span className="text-[9px] text-[#94a3b8] block uppercase">REEL LENGTH</span>
                  <span className="text-3xl font-black text-white tracking-widest block font-mono">
                    {formatTimer(recordingSeconds)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-zinc-400">
                  <div className="p-2.5 bg-[#07070a] rounded border border-zinc-900 space-y-0.5">
                    <span className="text-[8px] text-zinc-550 block uppercase">BUFFER ACCUMULATED</span>
                    <span className="text-zinc-200 block font-bold">{formatBytes(recordedBytes)}</span>
                  </div>
                  <div className="p-2.5 bg-[#07070a] rounded border border-zinc-900 space-y-0.5">
                    <span className="text-[8px] text-zinc-550 block uppercase">SAMPLING WIDTH</span>
                    <span className="text-zinc-200 block font-bold">1280 × 720 HD</span>
                  </div>
                </div>

                {/* Dynamic operations controls */}
                <div className="pt-2 flex gap-2">
                  {recorderState === 'recording' ? (
                    <button
                      onClick={pauseRecordingWorkflow}
                      className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-mono text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>PAUSE CAPTURE</span>
                    </button>
                  ) : recorderState === 'paused' ? (
                    <button
                      onClick={resumeRecordingWorkflow}
                      className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-mono text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Play className="w-3.5 h-3.5 animate-pulse" />
                      <span>RESUME CAPTURE</span>
                    </button>
                  ) : null}

                  <button
                    onClick={stopRecordingWorkflow}
                    className="flex-1 py-2 bg-red-650 hover:bg-red-600 text-white rounded font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>STOP & RENDER</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Device level indicator voltmeter widget */}
          {recordMic && (
            <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest text-[#94a3b8]">
                <span className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  Voltmeter Analyzer
                </span>
                <span className="text-[10px] text-cyan-400">{audioLevel}%</span>
              </div>

              <div className="h-2 bg-[#07070a] rounded-full overflow-hidden border border-zinc-900">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-550 font-mono block uppercase">
                CONFIRME QUE LAS ONDAS CAPTURE AUDIO DE SU MICRÓFONO
              </span>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Studio Render Monitor Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
            
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                Apex Media monitor
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[10px] text-zinc-500 font-mono uppercase">REALTIME DIRECTORY LOCALHOST</span>
              </div>
            </div>

            {/* Hidden canvas rendering and screen sharing source buffers */}
            <canvas ref={renderCanvasRef} className="hidden" />
            <video ref={screenVideoRef} muted className="hidden" />

            {/* Capture core status routing */}
            {recorderState === 'idle' ? (
              
              /* Camera & PIP launcher sandbox dashboard */
              <div className="relative rounded overflow-hidden border border-zinc-900 bg-[#07070a] flex flex-col items-center justify-center min-h-[380px] p-6 text-center space-y-5">
                
                {/* Active webcam visual viewport overlay preview */}
                {recordCam ? (
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="relative mx-auto rounded overflow-hidden border border-cyan-500/30 bg-[#0a0a0f] flex items-center justify-center max-w-[240px] aspect-square">
                      <video 
                        ref={camVideoRef} 
                        muted 
                        playsInline
                        className="w-full h-full object-cover rounded transform -scale-x-100"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono text-cyan-400 border border-cyan-500/20 uppercase">
                        LIVE REFLECTOR
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={triggerPictureInPicture}
                          className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-mono text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>PIP POP-OUT (OVER ALL OS APPS)</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                        Picture-in-picture mode launches an elegant floating webcam bubble. You can position it floating anywhere on your monitor screen, and it will be captured into your workspace!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                      <VideoOff className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 max-w-md">
                      <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">webcam streaming disabled</h4>
                      <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                        Toggle on &quot;Record Webcam Camera&quot; in the left control panel to enable live bubble picture overlaps.
                      </p>
                    </div>
                  </div>
                )}

                {recordCam && (
                  /* Custom compositing bubble adjustments */
                  <div className="w-full max-w-md bg-[#0c0c10] border border-zinc-850 p-4 rounded text-left space-y-4 mt-2">
                    <span className="text-[9px] text-[#94a3b8] font-mono uppercase tracking-widest block font-bold">
                      Canvas Superimpose Bubble Customizer
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono">Corner Placement</span>
                        <select
                          value={camPosition}
                          onChange={(e: any) => setCamPosition(e.target.value)}
                          className="w-full bg-[#07070a] border border-zinc-800 rounded p-1 text-[10px] font-mono text-zinc-300"
                        >
                          <option value="bottom-left">Bottom-Left</option>
                          <option value="bottom-right">Bottom-Right</option>
                          <option value="top-left">Top-Left</option>
                          <option value="top-right">Top-Right</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono">Webcam Aspect</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCamShape('circle')}
                            className={`flex-1 py-1 rounded border text-[9px] font-mono ${
                              camShape === 'circle' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-[#07070a] border-zinc-800 text-zinc-500'
                            }`}
                          >
                            Circle
                          </button>
                          <button
                            onClick={() => setCamShape('square')}
                            className={`flex-1 py-1 rounded border text-[9px] font-mono ${
                              camShape === 'square' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-[#07070a] border-zinc-800 text-zinc-500'
                            }`}
                          >
                            Square
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono">Bubble Size</span>
                        <div className="flex gap-1 border-zinc-805">
                          {(['sm', 'md', 'lg'] as const).map(sz => (
                            <button
                              key={sz}
                              onClick={() => setCamSize(sz)}
                              className={`flex-1 py-1 rounded border text-[9px] font-mono ${
                                camSize === sz ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-[#07070a] border-zinc-800 text-zinc-500'
                              }`}
                            >
                              {sz.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

            ) : recorderState === 'countdown' ? (
              
              /* Pre-recording Countdown Overlay screen */
              <div className="relative rounded overflow-hidden border border-zinc-900 bg-[#07070a] flex flex-col items-center justify-center min-h-[380px] p-6 text-center">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-500 flex items-center justify-center mb-4"
                >
                  <span className="font-mono text-5xl font-black text-cyan-400">{countdown}</span>
                </motion.div>
                <span className="text-zinc-505 font-mono uppercase text-xs tracking-widest mt-2 animate-pulse">
                  preparing secure offline composition buffers...
                </span>
              </div>

            ) : recorderState === 'recording' || recorderState === 'paused' ? (
              
              /* Active capture visual telemetry monitor screen */
              <div className="relative rounded overflow-hidden border border-cyan-500/20 bg-[#07070a] flex flex-col items-center justify-center min-h-[380px] p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border border-red-500 bg-red-500/5 flex items-center justify-center relative animate-pulse">
                  <Disc className="w-8 h-8 text-red-500" />
                  <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold font-mono uppercase text-zinc-200 tracking-wider">
                    {recorderState === 'recording' ? 'now recording screen + voice overlay' : 'recording stream paused'}
                  </h4>
                  <p className="text-[11px] text-[#94a3b8] max-w-sm leading-normal">
                    The canvas merges screen captures and camera circles locally. Feel free to minimize the browser window or record slides — direct coordinates persist inline!
                  </p>
                </div>

                {recordCam && (
                  <span className="bg-[#0c0c10] border border-zinc-850 px-3 py-1 rounded text-[10px] font-mono text-cyan-400">
                    CANVAS OVERLAY BUBBLE: {camShape.toUpperCase()} (SIZE: {camSize.toUpperCase()}) POSITIONED AT {camPosition.toUpperCase()}
                  </span>
                )}
              </div>

            ) : (
              
              /* Complete state playback screen node */
              <div className="space-y-4 animate-fade-in">
                <div className="w-full bg-[#07070a] rounded border border-zinc-900 overflow-hidden">
                  
                  {recordedBlobUrl && (
                    <video 
                      src={recordedBlobUrl} 
                      controls 
                      className="w-full aspect-video bg-black"
                    />
                  )}

                </div>

                {/* Cleansed results download deck card */}
                <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
                  
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#94a3b8] font-mono uppercase tracking-widest font-black flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      REEL RECORDED SUCCESSFULLY
                    </span>
                    <div className="text-zinc-200 text-xs font-semibold">
                      Composed Reel • Duration: {formatTimer(recordedDuration)} • Res: 1280 × 720 HD
                    </div>
                  </div>

                  <a
                    href={recordedBlobUrl || '#'}
                    download={`Apex_Session_${new Date().toISOString().split('T')[0]}.webm`}
                    className="w-full md:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-550 active:scale-95 text-white whitespace-nowrap text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>DOWNLOAD VIDEO FILE</span>
                  </a>

                </div>

              </div>
            )}

            {/* Quick documentation guidance banner */}
            <div className="p-4 bg-[#0a0a0f] border border-zinc-850/50 rounded-lg text-zinc-400 text-xs">
              <span className="text-[10px] text-cyan-400 font-mono uppercase font-black tracking-widest block mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Browser Sandbox Tips
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-[#94a3b8]">
                <li>When sharing your screen, toggle on <strong className="text-zinc-305">&quot;Share audio&quot;</strong> in the browser prompt to include full tab sounds.</li>
                <li>Launch the <strong className="text-cyan-400">Picture-In-Picture</strong> camera popout if you want to record webcam overlay while working on desktop apps!</li>
                <li>All compositions and voice mixed files are handled 100% locally on your machine via JavaScript canvas streams; zero data ever touches an external server.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

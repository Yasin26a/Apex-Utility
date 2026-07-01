import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, ScreenShare, ShieldAlert, VideoOff, Play, Pause, Square, 
  Download, Loader2, Volume2, VolumeX, Mic, MicOff, RefreshCw, 
  Settings, HelpCircle, AlertCircle, Sparkles, CheckCircle, Monitor, 
  Camera, Move, Maximize2, Layers, Disc, Circle, Film, Sliders, Image as ImageIcon, Flame
} from 'lucide-react';
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

interface DeviceOption {
  deviceId: string;
  label: string;
}

export default function VideoRecorder({ mode = 'all' }: { mode?: 'all' | 'screen' | 'webcam' }) {
  const { language } = useLanguage();
  
  // Applet Log Trace
  useEffect(() => {
    logToolUsage(mode === 'screen' ? 'screen-recorder' : mode === 'webcam' ? 'webcam-recorder' : 'video-recorder');
  }, [mode]);

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
  const [recordScreen, setRecordScreen] = useState(mode !== 'webcam');
  const [recordCam, setRecordCam] = useState(mode === 'webcam' || mode === 'all');
  const [recordMic, setRecordMic] = useState(mode === 'webcam' || mode === 'all');
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

  // GIF Exporter Preferences
  const [gifWidth, setGifWidth] = useState<number>(640);
  const [gifFps, setGifFps] = useState<number>(10);
  const [maxColors, setMaxColors] = useState<number>(256);
  const [gifDither, setGifDither] = useState<boolean>(true);
  const [paletteStrategy, setPaletteStrategy] = useState<'global' | 'local'>('local');
  const [gifLooping, setGifLooping] = useState<boolean>(true);
  const [gifSpeed, setGifSpeed] = useState<number>(1.0);

  // GIF Compilation status
  const [compiledGifBlobUrl, setCompiledGifBlobUrl] = useState<string | null>(null);
  const [compiledGifSize, setCompiledGifSize] = useState<number>(0);
  const [isCompilingGif, setIsCompilingGif] = useState<boolean>(false);
  const [compilationProgress, setCompilationProgress] = useState<number>(0);
  const [compilationStage, setCompilationStage] = useState<string>('');
  const [recordedFramesCount, setRecordedFramesCount] = useState<number>(0);
  const [activeOutputTab, setActiveOutputTab] = useState<'video' | 'gif'>('video');

  // Frame lists (refs to prevent re-renders on dynamic capture frames)
  const gifFramesRef = useRef<{ data: Uint8ClampedArray; width: number; height: number; timestamp: number }[]>([]);
  const lastGifFrameTimeRef = useRef<number>(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Search query for video recorder FAQs
  const [recorderFaqSearchQuery, setRecorderFaqSearchQuery] = useState('');

  // Enumerating media capture nodes
  useEffect(() => {
    enumerateInputs(false);
    return () => {
      terminateAllSTreams();
      if (audioVolumeTimerRef.current) cancelAnimationFrame(audioVolumeTimerRef.current);
    };
  }, []);

  const enumerateInputs = async (askPermission: boolean = false) => {
    try {
      if (!navigator || !navigator.mediaDevices) {
        console.warn("Media devices API is undefined in this context/sandbox.");
        return;
      }
      
      if (askPermission) {
        // Trigger prompt permission to discover labels cleanly
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((s) => {
          // Stop discovery stream instantly
          s.getTracks().forEach(t => t.stop());
        }).catch(() => {
          // Fallback gracefully if hardware is busy or absent
        });
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoIn = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));
      const audioIn = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));

      setCamDevices(videoIn);
      setMicDevices(audioIn);

      if (videoIn.length > 0 && !selectedCam) setSelectedCam(videoIn[0].deviceId);
      if (audioIn.length > 0 && !selectedMic) setSelectedMic(audioIn[0].deviceId);

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

      // Refresh devices list silently to populate friendly name labels now that permission is approved
      enumerateInputs(false);
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
    setCompiledGifBlobUrl(null);
    setCompiledGifSize(0);
    setRecordedFramesCount(0);
    setActiveOutputTab('video');
    gifFramesRef.current = [];
    lastGifFrameTimeRef.current = 0;
    
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

        // Capture canvas snapshots for high-quality GIF creation (if actively recording)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          const nowTime = performance.now();
          const frameInterval = 1000 / gifFps;
          if (nowTime - lastGifFrameTimeRef.current >= frameInterval) {
            if (!offscreenCanvasRef.current) {
              offscreenCanvasRef.current = document.createElement('canvas');
            }
            const offCanvas = offscreenCanvasRef.current;
            
            // Downscale to preferred GIF export width
            const scale = gifWidth / width;
            const targetW = gifWidth;
            const targetH = Math.round(height * scale);
            
            offCanvas.width = targetW;
            offCanvas.height = targetH;
            
            const offCtx = offCanvas.getContext('2d');
            if (offCtx) {
              offCtx.drawImage(canvas, 0, 0, targetW, targetH);
              const imgData = offCtx.getImageData(0, 0, targetW, targetH);
              
              gifFramesRef.current.push({
                data: imgData.data,
                width: targetW,
                height: targetH,
                timestamp: nowTime
              });
            }
            lastGifFrameTimeRef.current = nowTime;
          }
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
        setRecordedFramesCount(gifFramesRef.current.length);
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

  const compileGif = () => {
    if (gifFramesRef.current.length === 0) return;
    setIsCompilingGif(true);
    setCompilationProgress(0);
    setCompilationStage('Preparing frame buffers...');
    setCompiledGifBlobUrl(null);
    setCompiledGifSize(0);

    // Run after a short tick to let UI update
    setTimeout(() => {
      try {
        const frames = gifFramesRef.current;
        const encoder = GIFEncoder();
        const delay = Math.round((1000 / gifFps) / gifSpeed);

        // Pre-compute global palette if chosen
        let globalPalette: any = null;
        if (paletteStrategy === 'global' && frames.length > 0) {
          setCompilationStage('Generating optimized global color map...');
          // Quantize color space using a middle or first frame
          const referenceFrame = frames[Math.floor(frames.length / 2)] || frames[0];
          globalPalette = quantize(referenceFrame.data, maxColors, { format: 'rgb565' });
        }

        let frameIndex = 0;

        const processFramesChunk = () => {
          if (frameIndex < frames.length) {
            setCompilationStage(`Dithering and writing frame ${frameIndex + 1} of ${frames.length}...`);
            setCompilationProgress(Math.round((frameIndex / frames.length) * 95));

            // Process 4 frames per micro-tick to stay responsive
            const chunkEnd = Math.min(frameIndex + 4, frames.length);
            for (let i = frameIndex; i < chunkEnd; i++) {
              const frame = frames[i];
              
              // Copy data to avoid modifying the original frames array if we re-render
              const frameDataCopy = new Uint8ClampedArray(frame.data);
              
              const palette = globalPalette || quantize(frameDataCopy, maxColors, { format: 'rgb565' });
              const index = applyPalette(frameDataCopy, palette, 'rgb565');
              
              encoder.writeFrame(index, frame.width, frame.height, {
                palette,
                delay: delay,
              });
            }

            frameIndex = chunkEnd;
            // Schedule next frame chunk
            setTimeout(processFramesChunk, 10);
          } else {
            setCompilationStage('Compressing and exporting GIF stream...');
            setCompilationProgress(98);

            setTimeout(() => {
              try {
                encoder.finish();
                const bytes = encoder.stream.bytes();
                const blob = new Blob([bytes], { type: 'image/gif' });
                const url = URL.createObjectURL(blob);

                setCompiledGifBlobUrl(url);
                setCompiledGifSize(blob.size);
                setCompilationProgress(100);
                setCompilationStage('Export Compiled Successfully!');
                setIsCompilingGif(false);
              } catch (e: any) {
                setErrorHeader(`GIF packing failed: ${e.message}`);
                setIsCompilingGif(false);
              }
            }, 50);
          }
        };

        // Launch progressive thread compilation
        processFramesChunk();

      } catch (err: any) {
        console.error(err);
        setErrorHeader(`GIF Compilation initializer failed: ${err.message}`);
        setIsCompilingGif(false);
      }
    }, 120);
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

          {recorderState === 'idle' && (
            <div className="p-5 rounded-lg border border-zinc-800/60 bg-[#0d0d12]/90 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#94a3b8] flex items-center gap-2 border-b border-[#18181b] pb-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                GIF Buffer Settings
              </h2>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">GIF Resolution Width</label>
                  <select
                    value={gifWidth}
                    onChange={(e) => setGifWidth(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value={320}>320px (Compact / Small Size)</option>
                    <option value={480}>480px (Optimized standard)</option>
                    <option value={640}>640px (Sharp - Recommended)</option>
                    <option value={800}>800px (High Quality)</option>
                    <option value={1280}>1280px (Screencast / Full size)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">GIF Sample Framerate</label>
                  <select
                    value={gifFps}
                    onChange={(e) => setGifFps(Number(e.target.value))}
                    className="w-full bg-[#07070a] border border-zinc-850 rounded p-2 text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value={5}>5 FPS (Low weight)</option>
                    <option value={8}>8 FPS (Standard online)</option>
                    <option value={10}>10 FPS (Fluid - Recommended)</option>
                    <option value={12}>12 FPS (Super fluid)</option>
                    <option value={15}>15 FPS (HD vector rate)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    Durable in-browser memory caching collects frames at these metrics for your high-quality GIF compiles.
                  </p>
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
              <div className="space-y-5 animate-fade-in">
                {/* Visual Tab Selectors */}
                <div className="flex border-b border-zinc-900 pb-px">
                  <button
                    onClick={() => setActiveOutputTab('video')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeOutputTab === 'video'
                        ? 'border-cyan-500 text-cyan-400 bg-cyan-500/[0.02]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video Recording Reel (.webm)</span>
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('gif')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeOutputTab === 'gif'
                        ? 'border-cyan-500 text-cyan-400 bg-cyan-500/[0.02]'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    <span>Instant GIF Exporter ({recordedFramesCount} frames buffered)</span>
                  </button>
                </div>

                {activeOutputTab === 'video' ? (
                  <div className="space-y-4">
                    <div className="w-full bg-[#07070a] rounded border border-zinc-900 overflow-hidden">
                      {recordedBlobUrl && (
                        <video 
                          src={recordedBlobUrl} 
                          controls 
                          className="w-full aspect-video bg-black"
                        />
                      )}
                    </div>

                    <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#94a3b8] font-mono uppercase tracking-widest font-black flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                          VIDEO COMPOSTED SECURELY
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
                ) : (
                  /* GIF EXPORTER ENGINE */
                  <div className="space-y-5">
                    <div className="p-5 rounded-lg border border-zinc-904 bg-[#07070a] space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <span className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-widest font-bold block">
                          Instant Quantizer & Compression Setup
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-400 font-mono text-[9px] font-bold">
                          100% IN-BROWSER
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block">Max Color Depth</label>
                          <select
                            value={maxColors}
                            onChange={(e) => {
                              setMaxColors(Number(e.target.value));
                              setCompiledGifBlobUrl(null); // Reset compiled cache
                            }}
                            className="w-full bg-[#0c0c10] border border-zinc-800 rounded p-1.5 text-xs text-zinc-305 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value={256}>256 Colors (High Fidelity)</option>
                            <option value={128}>128 Colors (Optimized standard)</option>
                            <option value={64}>64 Colors (Lightweight motion)</option>
                            <option value={32}>32 Colors (Retro high-contrast)</option>
                            <option value={16}>16 Colors (Low-bit pixel)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block font-mono">Map Strategy</label>
                          <select
                            value={paletteStrategy}
                            onChange={(e: any) => {
                              setPaletteStrategy(e.target.value);
                              setCompiledGifBlobUrl(null);
                            }}
                            className="w-full bg-[#0c0c10] border border-zinc-800 rounded p-1.5 text-xs text-zinc-305 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value="local">Per-Frame Local (Precise gradients)</option>
                            <option value="global">Uniform Global (Compact size)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block font-mono">Speed scale factor</label>
                          <select
                            value={gifSpeed}
                            onChange={(e) => {
                              setGifSpeed(Number(e.target.value));
                              setCompiledGifBlobUrl(null);
                            }}
                            className="w-full bg-[#0c0c10] border border-zinc-800 rounded p-1.5 text-xs text-zinc-350 focus:outline-none focus:border-cyan-500/50"
                          >
                            <option value={1.0}>1.0x (Standard original)</option>
                            <option value={1.5}>1.5x (Fast motion)</option>
                            <option value={2.0}>2.0x (Double Speed)</option>
                            <option value={3.0}>3.0x (Time-Lapse reel)</option>
                            <option value={0.5}>0.5x (Slow Motion)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block">Quantization Dither</label>
                          <button
                            onClick={() => {
                              setGifDither(!gifDither);
                              setCompiledGifBlobUrl(null);
                            }}
                            className={`w-full py-1.5 rounded border text-xs font-mono transition-all font-semibold cursor-pointer ${
                              gifDither 
                                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                                : 'bg-[#0c0c10] border-zinc-800 text-zinc-500'
                            }`}
                          >
                            {gifDither ? 'ACTIVE (Floyd-Steinberg)' : 'DISABLED'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isCompilingGif ? (
                      /* ACTIVE COMPILATION PROGRESS PANEL */
                      <div className="p-10 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.02] text-center space-y-4">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                        <div className="space-y-2 max-w-sm mx-auto">
                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                            <span className="uppercase tracking-wider">{compilationStage}</span>
                            <span>{compilationProgress}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${compilationProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : compiledGifBlobUrl ? (
                      /* SUCCESSFUL COMPILED PREVIEW CARD */
                      <div className="space-y-4 animate-fade-in">
                        <div className="p-8 rounded-lg border border-zinc-900 bg-[#07070a] flex flex-col items-center justify-center">
                          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block mb-4">
                            GIF Loop Render Output
                          </span>
                          <div className="max-w-full rounded border border-zinc-800 bg-[#040406] overflow-hidden p-2 shadow-inner">
                            <img 
                              src={compiledGifBlobUrl} 
                              alt="Compiled Screen Rec Reel" 
                              referrerPolicy="no-referrer"
                              className="max-h-[350px] object-contain"
                            />
                          </div>
                        </div>

                        <div className="p-4 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] text-green-400 font-mono uppercase tracking-widest font-black flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              GIF COMPILED LOCALLY
                            </span>
                            <div className="text-zinc-200 text-xs font-semibold font-mono">
                              Resolution: {gifWidth}px Wide • Estimated Size: {formatBytes(compiledGifSize)} • Delay: {Math.round((1000 / gifFps) / gifSpeed)}ms
                            </div>
                          </div>

                          <a
                            href={compiledGifBlobUrl}
                            download={`Apex_Clip_${new Date().toISOString().split('T')[0]}.gif`}
                            className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-550 active:scale-95 text-white whitespace-nowrap text-xs font-mono font-bold rounded flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-lg animate-bounce"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>DOWNLOAD GIF FILE</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* CTA ACTION TRIGGER */
                      <div className="p-8 rounded-lg border border-dashed border-zinc-850 text-center space-y-4">
                        <ImageIcon className="w-10 h-10 text-zinc-650 mx-auto" />
                        <div className="space-y-1.5 max-w-sm mx-auto">
                          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Compile Screen Capture to GIF</h4>
                          <p className="text-[11px] text-zinc-550 leading-normal">
                            Convert the {recordedFramesCount} buffered raw video frames to a high-quality looping GIF instantly using dither-quantized color algorithms.
                          </p>
                        </div>
                        <button
                          onClick={compileGif}
                          className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-555 hover:to-emerald-555 active:scale-98 text-white rounded font-mono font-bold text-xs flex items-center gap-2 mx-auto transition-all cursor-pointer shadow-lg"
                        >
                          <Flame className="w-4 h-4 animate-pulse text-yellow-300" />
                          <span>SYNTHESIZE LOOPING GIF NOW</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Expanded Searchable FAQ section for Video & Screen Recorder */}
            <div className="p-5 border border-zinc-900 bg-[#0a0a0f] rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Screen &amp; Webcam Recorder FAQ Hub</span>
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500">Learn how to record screen, capture webcam overlay, sync audio, and export without watermarks</p>
                </div>

                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search recorder topics..."
                    value={recorderFaqSearchQuery}
                    onChange={(e) => setRecorderFaqSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-zinc-950 text-white placeholder-zinc-650 text-xs px-3 py-1.5 rounded-lg border border-zinc-900 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    q: "How can I use this screen recorder free online with no watermark?",
                    a: "Our in-browser screen recorder free online tool requires no account and puts absolutely zero watermarks on your files. You can capture any tab, browser window, or your entire desktop. It runs as a free screen recording tool entirely client-side, making it one of the best choices for secure, free online screen capture without time limits. It works flawlessly as a screen recorder free no time limit option on windows 10, windows 11, and macOS."
                  },
                  {
                    q: "How do I record a video on my computer with both screen and webcam at the same time?",
                    a: "Simply toggle the screen recorder with webcam preferences before starting your capture. By selecting both 'Record Screen' and 'Record Camera Feed', you activate the webcam and screen recorder composite mode. This places a highly customizable webcam overlay bubble anywhere on your screen. You can position, resize, and style it as a circle or square. It's the ultimate screen recorder with camera configuration for tutorial makers and streamers alike."
                  },
                  {
                    q: "Can I capture high-quality system sound and microphone voice audio?",
                    a: "Yes! By utilizing our computer screen recorder with audio features, you can capture crystal-clear sound feeds. When initiating the screen share, make sure to enable the 'Share system audio' checkbox in your browser's prompt. Additionally, toggle on the microphone stream to record voiceovers with our screen recorder for pc with audio. This delivers a fully synchronized screen recorder with camera and audio track in high definition."
                  },
                  {
                    q: "What tools does this webcam recorder and camera app for pc offer?",
                    a: "Beyond desktop recording, this suite is a complete online webcam recorder and camera app for pc. You can use it to test and record raw camera streams, adjust overlay shapes, capture frames, or use it as a standalone webcam video recorder. You can choose your preferred device from any connected usb webcam or laptop camera, perform a camera check online, and download raw recorded footage instantly without uploads."
                  },
                  {
                    q: "Is there any post-processing, compression, or AI video support?",
                    a: "Our companion Video Studio Suite includes comprehensive utilities like a video compressor, video cutter, format transcoder, and subtitle converter. If you need to boost or enhance your clips, you can pair your recorded files with our offline video booster or local ai video utilities. It's like having professional-grade recording and editing software completely offline."
                  }
                ]
                .filter(faq => 
                  faq.q.toLowerCase().includes(recorderFaqSearchQuery.toLowerCase()) || 
                  faq.a.toLowerCase().includes(recorderFaqSearchQuery.toLowerCase())
                )
                .map((faq, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-1">
                    <span className="text-[11px] font-heading font-extrabold text-cyan-400 uppercase tracking-wide block">Q: {faq.q}</span>
                    <p className="text-[11px] font-sans text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

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

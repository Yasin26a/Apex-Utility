import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  Upload, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Square, 
  Info, 
  Scissors, 
  RefreshCw, 
  Music, 
  Clock, 
  Maximize2, 
  ZoomIn, 
  Layers, 
  Settings, 
  VolumeX, 
  Sparkles, 
  Check, 
  Video, 
  Sparkle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { logToolUsage } from '../utils/toolAnalytics';

// Helper to format track times to minutes:seconds.milliseconds
function formatPreciseTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.000';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Format bytes to readable string
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function AudioTrimmer() {
  const { t, language } = useLanguage();
  
  // App states
  const [file, setFile] = useState<File | null>(null);
  const [decodedBuffer, setDecodedBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodingProgress, setDecodingProgress] = useState<number>(0);
  
  // Trimming offsets (in seconds)
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [zoomFactor, setZoomFactor] = useState<number>(1.0);
  
  // Export status
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  
  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playheadRafRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);

  // Localization Labels
  const labels: Record<string, any> = {
    en: {
      title: 'Audio Trimmer Studio',
      subtitle: 'High-Fidelity Client-Side Audio Splice',
      uploadTitle: 'Import Audio File',
      uploadDesc: 'Supports MP3, WAV, OGG, AAC, and FLAC files. Up to 100MB. Processing is 100% local inside sandbox browser memory.',
      loadingMsg: 'Decoding PCM audio waves... Please wait.',
      metaTitle: 'Audio Element Telemetry',
      duration: 'Total Duration',
      sampleRate: 'Sample Rate',
      channels: 'Audio Channels',
      trimTitle: 'Trim Interval Markers',
      startBtn: 'Set Start',
      endBtn: 'Set End',
      exportBtn: 'Trim & Export Audio',
      exportingMsg: 'Assembling audio channels and constructing PCM WAV headers...',
      successMsg: 'WAV Extraction complete!',
      downloadBtn: 'Download Trimmed Track',
      playRegion: 'Play Selection',
      stopRegion: 'Stop Playback',
      loopLabel: 'Loop Segment',
      speedLabel: 'Playback Rate',
      zoomLabel: 'Waveform Zoom x',
      setStartCur: 'Set start to playhead',
      setEndCur: 'Set end to playhead',
      mono: 'Mono',
      stereo: 'Stereo',
      volumeLabel: 'Volume',
      preciseControls: 'Precision Alignment (Seconds)',
      originalSize: 'Source Size',
      estimatedSize: 'Estimated Crop Size',
      sampleAudio: 'Load Sample',
      sampleLoaded: 'Demonstration track loaded. Drag handles to trim!',
      errorFormat: 'Invalid file format. Please upload an audio file.',
      zoomHint: 'Zoom in to focus on millisecond alignments.'
    },
    es: {
      title: 'Recortador de Audio',
      subtitle: 'Alineación de audio local de alta fidelidad',
      uploadTitle: 'Importar Archivo de Audio',
      uploadDesc: 'Admite MP3, WAV, OGG, AAC, y FLAC. Hasta 100MB. Procesamiento 100% local y privado en el navegador.',
      loadingMsg: 'Decodificando ondas de audio... Por favor espere.',
      metaTitle: 'Telemetría de Audio',
      duration: 'Duración total',
      sampleRate: 'Frecuencia de Muestreo',
      channels: 'Canales de Audio',
      trimTitle: 'Marcadores de Intervalo',
      startBtn: 'Fijar Inicio',
      endBtn: 'Fijar Fin',
      exportBtn: 'Recortar y Exportar Audio',
      exportingMsg: 'Ensamblando canales y construyendo cabeceras PCM WAV...',
      successMsg: '¡Extracción WAV completada con éxito!',
      downloadBtn: 'Descargar Audio Recortado',
      playRegion: 'Reproducir Selección',
      stopRegion: 'Detener',
      loopLabel: 'Bucle de Selección',
      speedLabel: 'Velocidad de Reproducción',
      zoomLabel: 'Zoom de Onda x',
      setStartCur: 'Inicio al reproductor',
      setEndCur: 'Fin al reproductor',
      mono: 'Mono',
      stereo: 'Estéreo',
      volumeLabel: 'Volumen',
      preciseControls: 'Alineación de Precisión (Segundos)',
      originalSize: 'Tamaño Original',
      estimatedSize: 'Tamaño Recortado Est.',
      sampleAudio: 'Cargar Demostración',
      sampleLoaded: 'Pista de demostración cargada. ¡Arrastra los controles para recortar!',
      errorFormat: 'Formato de archivo inválido. Por favor, sube un archivo de audio.',
      zoomHint: 'Amplía la onda para ajustes milimétricos de precisión.'
    },
    fr: {
      title: 'Coupeur Audio',
      subtitle: 'Découpe audio locale haute fidélité',
      uploadTitle: 'Importer un fichier audio',
      uploadDesc: 'Prend en charge MP3, WAV, OGG, AAC, et FLAC. Max 100 Mo. Traitement 100% sécurisé et local dans votre navigateur.',
      loadingMsg: 'Décodage des signaux audio... Veuillez patienter.',
      metaTitle: 'Télémétrie du fichier audio',
      duration: 'Durée totale',
      sampleRate: 'Fréquence d\'échantillonnage',
      channels: 'Canaux audio',
      trimTitle: 'Marqueurs de sélection',
      startBtn: 'Début',
      endBtn: 'Fin',
      exportBtn: 'Découper et Exporter',
      exportingMsg: 'Assemblage des pistes et écriture des en-têtes PCM WAV...',
      successMsg: 'Découpe terminée avec succès !',
      downloadBtn: 'Télécharger le fichier découpé',
      playRegion: 'Lire la sélection',
      stopRegion: 'Arrêter',
      loopLabel: 'Lecture en boucle',
      speedLabel: 'Vitesse de lecture',
      zoomLabel: 'Zoom forme d\'onde x',
      setStartCur: 'Début au curseur',
      setEndCur: 'Fin au curseur',
      mono: 'Mono',
      stereo: 'Stéréo',
      volumeLabel: 'Volume',
      preciseControls: 'Ajustement précis (Secondes)',
      originalSize: 'Taille Originale',
      estimatedSize: 'Taille Estimée après découpe',
      sampleAudio: 'Charger un exemple',
      sampleLoaded: 'Exemple de démonstration chargé. Ajustez les curseurs pour découper !',
      errorFormat: 'Format audio non supporté. Veuillez importer un fichier audio valide.',
      zoomHint: 'Zoomez pour repérer précisément les détails sonores.'
    },
    de: {
      title: 'Audio-Trimmer',
      subtitle: 'Hochpräzises clientseitiges Audioschneide-Studio',
      uploadTitle: 'Audiodatei hochladen',
      uploadDesc: 'Unterstützt MP3, WAV, OGG, AAC und FLAC. Max. 100 MB. Die Verarbeitung erfolgt zu 100 % lokal im sicheren Browser-Sandbox.',
      loadingMsg: 'Dekodiere Audiosignale... Bitte warten.',
      metaTitle: 'Schnittstellendaten',
      duration: 'Gesamtdauer',
      sampleRate: 'Abtastrate',
      channels: 'Tonkanäle',
      trimTitle: 'Schnittmarkenvorlage',
      startBtn: 'Start festlegen',
      endBtn: 'Ende festlegen',
      exportBtn: 'Schneiden & Exportieren',
      exportingMsg: 'Führe Audiokanäle zusammen und erstelle WAV-Header...',
      successMsg: 'WAV-Extraktion erfolgreich abgeschlossen!',
      downloadBtn: 'Geschnittene Datei herunterladen',
      playRegion: 'Auswahl abspielen',
      stopRegion: 'Wiedergabe stoppen',
      loopLabel: 'Endlosschleife',
      speedLabel: 'Wiedergabegeschwindigkeit',
      zoomLabel: 'Wellenform-Zoom x',
      setStartCur: 'Start auf aktuelle Position',
      setEndCur: 'Ende auf aktuelle Position',
      mono: 'Mono',
      stereo: 'Stereo',
      volumeLabel: 'Lautstärke',
      preciseControls: 'Präzisionsausrichtung (Sekunden)',
      originalSize: 'Dateigröße',
      estimatedSize: 'Geschätzte Exportgröße',
      sampleAudio: 'Demo Laden',
      sampleLoaded: 'Demosong geladen. Ziehen Sie die Marken zum Zuschneiden!',
      errorFormat: 'Ungültiges Dateiformat. Bitte laden Sie eine Audiodatei hoch.',
      zoomHint: 'Verwenden Sie den Zoom für millisekundengenaue Schnitte.'
    },
    pt: {
      title: 'Cortador de Áudio',
      subtitle: 'Aparador de áudio local de alta fidelidade',
      uploadTitle: 'Importar Arquivo de Áudio',
      uploadDesc: 'Suporta MP3, WAV, OGG, AAC e FLAC. Até 100MB. Processamento de dados 100% local com máxima privacidade.',
      loadingMsg: 'Decodificando ondas de som... Por favor, aguarde.',
      metaTitle: 'Telemetria do Elemento de Áudio',
      duration: 'Duração Total',
      sampleRate: 'Taxa de Amostragem',
      channels: 'Canais de Áudio',
      trimTitle: 'Marcadores de Intervalo',
      startBtn: 'Definir Início',
      endBtn: 'Definir Fim',
      exportBtn: 'Cortar e Exportar Áudio',
      exportingMsg: 'Agrupando canais de áudio e gerando cabeçalhos WAV PCM...',
      successMsg: 'Extração WAV concluída com sucesso!',
      downloadBtn: 'Baixar Faixa Recortada',
      playRegion: 'Tocar Seleção',
      stopRegion: 'Parar Áudio',
      loopLabel: 'Loop na Seleção',
      speedLabel: 'Taxa de Velocidade',
      zoomLabel: 'Zoom de Onda x',
      setStartCur: 'Início na agulha',
      setEndCur: 'Fim na agulha',
      mono: 'Mono',
      stereo: 'Estéreo',
      volumeLabel: 'Volume',
      preciseControls: 'Ajuste Fino de Precisão (Segundos)',
      originalSize: 'Tamanho de Origem',
      estimatedSize: 'Tamanho Recortado Est.',
      sampleAudio: 'Carregar Exemplo',
      sampleLoaded: 'Faixa de demonstração carregada. Ajuste as alças para cortar!',
      errorFormat: 'Formato inviável. Carregue um arquivo de áudio legítimo.',
      zoomHint: 'Amplie a onda para encontrar fragmentos exatos de milissegundos.'
    }
  };

  const l = labels[language] || labels.en;

  // Initialize Web Audio Context dynamically on demand to comply with browser autoplay protections
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxConstructor();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    // Sync local volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
    return audioCtxRef.current;
  };

  // Decode file array buffer to AudioBuffer
  const decodeAudioFile = (audioFile: File) => {
    setIsDecoding(true);
    setDecodingProgress(15);
    setExportUrl(null);
    setExportSuccess(false);
    stopPlayback();

    const reader = new FileReader();
    reader.onload = async (e) => {
      setDecodingProgress(55);
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const ctx = initAudioCtx();
      
      try {
        setDecodingProgress(75);
        ctx.decodeAudioData(arrayBuffer, (buffer) => {
          setDecodedBuffer(buffer);
          setStartTime(0);
          setEndTime(buffer.duration);
          setCurrentTime(0);
          setDecodingProgress(100);
          setTimeout(() => setIsDecoding(false), 300);
          
          logToolUsage('audio-trimmer');
        }, (err) => {
          console.error("Decoding error:", err);
          alert("Error decoding audio data. Please ensure it is a valid, uncorrupted audio format.");
          setIsDecoding(false);
        });
      } catch (err) {
        console.error("Critical AudioContext crash:", err);
        alert("AudioContext was unable to parse this file. Try converted WAV or standard MP3 format.");
        setIsDecoding(false);
      }
    };
    reader.readAsArrayBuffer(audioFile);
  };

  // Trigger Local Synthesized Sample Generation for smooth instant onboarding testing without uploads
  const loadSampleTrack = () => {
    setIsDecoding(true);
    setDecodingProgress(20);
    const sampleRate = 44100;
    const duration = 12.0; // 12 seconds preview synth
    const ctx = initAudioCtx();
    
    setTimeout(() => {
      setDecodingProgress(60);
      const numSamples = sampleRate * duration;
      const buffer = ctx.createBuffer(2, numSamples, sampleRate);
      
      // Synthesize a retro melodic loop with frequency sweeps to look amazing on the waveform
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        const factor = channel === 0 ? 1 : 1.05;
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          // Core synth frequencies
          const freqBase = 220 + 110 * Math.sin(2 * Math.PI * 0.15 * t);
          const volumeEnvelope = t < 0.5 ? t / 0.5 : (duration - t < 1.0 ? (duration - t) / 1.0 : 1.0);
          
          // Generate wave composite
          const mainSin = Math.sin(2 * Math.PI * freqBase * factor * t);
          const beatLfo = Math.sin(2 * Math.PI * 4 * t);
          const harmony = 0.4 * Math.sin(2 * Math.PI * freqBase * 2 * factor * t);
          
          data[i] = (mainSin * 0.5 + HarmonyModifier(harmony) + beatLfo * 0.1) * volumeEnvelope * 0.4;
        }
      }
      
      function HarmonyModifier(val: number) {
        return val * 1.1;
      }

      setDecodedBuffer(buffer);
      setStartTime(2.5); // pre-highlight dynamic region to guide user nicely
      setEndTime(9.5);
      setCurrentTime(2.5);
      setDecodingProgress(100);
      setIsDecoding(false);
      
      // Fake metadata state
      const mockFile = new File([], "synthesizer_test_sequence.wav", { type: "audio/wav" });
      Object.defineProperty(mockFile, "size", { value: 2116800 });
      setFile(mockFile);
    }, 450);
  };

  // Handle Drag / Selection of file inputs
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      decodeAudioFile(selected);
    }
  };

  // Drag and drop event listeners
  const [onDrag, setOnDrag] = useState<boolean>(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setOnDrag(true);
  };
  const handleDragLeave = () => {
    setOnDrag(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOnDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type.startsWith('audio/') || dropped.name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
        setFile(dropped);
        decodeAudioFile(dropped);
      } else {
        alert(l.errorFormat);
      }
    }
  };

  // Track playback time update frame loops
  const drawPlayheadFrame = () => {
    if (!isPlaying) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const elapsed = ctx.currentTime - playbackStartTimeRef.current;
    const actualCurrent = playbackStartOffsetRef.current + elapsed * playbackSpeed;
    
    if (actualCurrent >= endTime) {
      if (isLooping) {
        // Restart preview loop automatically
        playSelectionSegment(startTime);
      } else {
        stopPlayback();
        setCurrentTime(startTime);
      }
    } else {
      setCurrentTime(actualCurrent);
      playheadRafRef.current = requestAnimationFrame(drawPlayheadFrame);
    }
  };

  // Trigger Segment playback
  const playSelectionSegment = (startOffsetSeconds: number) => {
    const ctx = initAudioCtx();
    stopPlayback(); // close existing sound sources
    
    if (!decodedBuffer) return;
    
    // Create new Audio Source and patch destination
    const source = ctx.createBufferSource();
    source.buffer = decodedBuffer;
    source.playbackRate.setValueAtTime(playbackSpeed, ctx.currentTime);
    
    if (gainNodeRef.current) {
      source.connect(gainNodeRef.current);
    } else {
      source.connect(ctx.destination);
    }
    
    // Safety clamp boundary offset
    const activeStart = Math.max(startTime, Math.min(startOffsetSeconds, endTime));
    const durationToPlay = Math.max(0.01, endTime - activeStart);
    
    playbackStartTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = activeStart;
    
    // Start playback sequence
    source.start(0, activeStart, durationToPlay);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setCurrentTime(activeStart);
    
    // Begin RAF layout updates
    playheadRafRef.current = requestAnimationFrame(drawPlayheadFrame);
  };

  // Pause playback
  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Already stopped/discarded source node is fine
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (playheadRafRef.current) {
      cancelAnimationFrame(playheadRafRef.current);
      playheadRafRef.current = null;
    }
    setIsPlaying(false);
  };

  // Live Sound Volume Adjustment
  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVal, audioCtxRef.current.currentTime);
    }
  };

  // Live Playback Speed Adjustment
  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (sourceNodeRef.current && audioCtxRef.current) {
      sourceNodeRef.current.playbackRate.setValueAtTime(newSpeed, audioCtxRef.current.currentTime);
      
      // Re-calculate the relative elapsed timeline alignment
      const ctx = audioCtxRef.current;
      const elapsed = ctx.currentTime - playbackStartTimeRef.current;
      const currentPos = playbackStartOffsetRef.current + elapsed * (sourceNodeRef.current.playbackRate.value || 1);
      
      playbackStartTimeRef.current = ctx.currentTime;
      playbackStartOffsetRef.current = currentPos;
    }
  };

  // Watch Trimming Range to ensure logic correctness (start never exceeds end)
  const setClampedStartTime = (val: number) => {
    const clamped = Math.max(0, Math.min(val, endTime - 0.05));
    setStartTime(clamped);
    if (currentTime < clamped) {
      setCurrentTime(clamped);
    }
  };

  const setClampedEndTime = (val: number) => {
    if (!decodedBuffer) return;
    const clamped = Math.max(startTime + 0.05, Math.min(val, decodedBuffer.duration));
    setEndTime(clamped);
    if (currentTime > clamped) {
      setCurrentTime(clamped);
    }
  };

  // Set selectors directly to where the audio playhead needle is currently resting
  const setStartToPlayhead = () => {
    setClampedStartTime(currentTime);
  };

  const setEndToPlayhead = () => {
    setClampedEndTime(currentTime);
  };

  // Build local PCM Audio Waveform Data Cache
  const waveformCache = useMemo(() => {
    if (!decodedBuffer) return [];
    
    // Get downsampled sample points
    const channelData = decodedBuffer.getChannelData(0); // Left channel is sufficient for waveform
    const samplingPoints = 300; // base horizontal pixel resolution
    const sampleBucketSize = Math.floor(channelData.length / samplingPoints);
    const results: number[] = [];
    
    for (let i = 0; i < samplingPoints; i++) {
      const offset = i * sampleBucketSize;
      let maxVal = 0;
      // Get peaks in bucket
      for (let j = 0; j < sampleBucketSize && (offset + j) < channelData.length; j += 4) {
        const val = Math.abs(channelData[offset + j]);
        if (val > maxVal) {
          maxVal = val;
        }
      }
      results.push(maxVal);
    }
    
    // Normalize waveform bars to have consistent max-height ratio
    const topBar = Math.max(...results) || 1.0;
    return results.map(v => v / topBar);
  }, [decodedBuffer]);

  // Handle manual canvas scrubbing/clicking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !decodedBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const targetSeconds = ratio * decodedBuffer.duration;
    
    setCurrentTime(targetSeconds);
    if (isPlaying) {
      playSelectionSegment(targetSeconds);
    }
  };

  // Re-render Canvas with waveform peaks, active overlays, zoom parameters, and current timeline playhead needle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !decodedBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and match exact client size
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = canvas.parentElement?.clientWidth || 600;
    const canvasHeight = 160;
    
    // Horizontal space multiplied by zoomFactor
    const virtualSpanWidth = parentWidth * zoomFactor;
    
    canvas.width = virtualSpanWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);
    
    const w = virtualSpanWidth;
    const h = canvasHeight;
    ctx.clearRect(0, 0, w, h);
    
    // Draw background tracks grid
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    const peaks = waveformCache;
    if (peaks.length === 0) return;
    
    const barWidth = 3;
    const barSpacing = 2;
    const numBars = Math.floor(w / (barWidth + barSpacing));
    const duration = decodedBuffer.duration;
    
    // Draw waveform bars
    for (let i = 0; i < numBars; i++) {
      const ratio = i / numBars;
      const barTime = ratio * duration;
      
      // Downsample cached peak
      const peakIndex = Math.floor(ratio * peaks.length);
      const normalizedPeak = peaks[peakIndex] || 0.05;
      
      const barHeight = Math.max(4, normalizedPeak * (h - 20));
      const x = i * (barWidth + barSpacing);
      const y = (h - barHeight) / 2;
      
      // Color coding depending on active trimmed selection bounds
      const isSelected = barTime >= startTime && barTime <= endTime;
      
      if (isSelected) {
        // Elegant gradient for selected region
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.95)'); // indigo
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 1)'); // cyan
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.95)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(113, 113, 122, 0.16)'; // quiet zinc
      }
      
      // Draw rounded rect bar
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, 1.5) : ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
    }
    
    // Draw selection overlay tint
    const startX = (startTime / duration) * w;
    const endX = (endTime / duration) * w;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.fillRect(startX, 0, endX - startX, h);
    
    // Draw start marker line boundary
    ctx.strokeStyle = '#6366f1'; // indigo
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, h);
    ctx.stroke();
    
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(startX, h - 8, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw end marker line boundary
    ctx.strokeStyle = '#06b6d4'; // cyan
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
    
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(endX, 8, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw current player playhead cursor needle
    const cursorX = (currentTime / duration) * w;
    ctx.strokeStyle = '#f59e0b'; // amber playhead
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, h);
    ctx.stroke();
    
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cursorX - 5, 0);
    ctx.lineTo(cursorX + 5, 0);
    ctx.lineTo(cursorX, 7);
    ctx.closePath();
    ctx.fill();
    
  }, [decodedBuffer, waveformCache, startTime, endTime, currentTime, zoomFactor]);

  // Estimated crop size calculation based on duration ratio
  const estimatedCropWeight = useMemo(() => {
    if (!file || !decodedBuffer) return 0;
    const ratio = (endTime - startTime) / decodedBuffer.duration;
    return Math.round(file.size * ratio * 0.96); // factor WAV headers lightly
  }, [file, decodedBuffer, startTime, endTime]);

  // Build audio channels, write the 16bit PCM elements, construct down-links
  const handleExportTrimAction = async () => {
    if (!decodedBuffer) return;
    setIsExporting(true);
    setExportSuccess(false);
    setExportUrl(null);
    stopPlayback();
    
    // Wrap inside micro-task timer to avoid freezing client browser thread during encoding
    setTimeout(() => {
      try {
        const sampleRate = decodedBuffer.sampleRate;
        const numChannels = decodedBuffer.numberOfChannels;
        
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const sampleLength = Math.max(2, endSample - startSample);
        
        // Assemble cropped channels
        const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
          numChannels, 
          sampleLength, 
          sampleRate
        );
        
        const outputBuffer = offlineCtx.createBuffer(numChannels, sampleLength, sampleRate);
        
        for (let ch = 0; ch < numChannels; ch++) {
          const originalChannelData = decodedBuffer.getChannelData(ch);
          const slicedChannelData = outputBuffer.getChannelData(ch);
          
          for (let s = 0; s < sampleLength; s++) {
            slicedChannelData[s] = originalChannelData[startSample + s] || 0;
          }
        }
        
        // Convert the AudioBuffer to a secure local WAV-encoded Blob
        const wavBlob = encodeAudioBufferToWav(outputBuffer);
        const url = URL.createObjectURL(wavBlob);
        
        setExportUrl(url);
        setExportSuccess(true);
        setIsExporting(false);
      } catch (err) {
        console.error("WAV Compiler failed:", err);
        alert("Encountered an exception writing the WAV structure. Ensure memory is free.");
        setIsExporting(false);
      }
    }, 600);
  };

  // Helper WAV compiling binary matrix
  const encodeAudioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // Uncompressed Integer PCM
    const bitDepth = 16;
    
    let interleavedSamples: Float32Array;
    if (numOfChan === 2) {
      // Alternate left & right audio frames
      interleavedSamples = interleaveChannelLines(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      interleavedSamples = buffer.getChannelData(0);
    }
    
    const byteLength = interleavedSamples.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + byteLength);
    const view = new DataView(arrayBuffer);
    
    // 1-4 RIFF descriptor
    writeAsciiString(view, 0, 'RIFF');
    // 5-8 Size of complete file minus RIFF header fields
    view.setUint32(4, 36 + byteLength, true);
    // 9-12 Format tag
    writeAsciiString(view, 8, 'WAVE');
    // Sub-chunk 1: Format details
    writeAsciiString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // format chunk size
    view.setUint16(20, format, true); // Linear PCM
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true); // Byte rate
    view.setUint16(32, numOfChan * (bitDepth / 8), true); // Block alignment
    view.setUint16(34, bitDepth, true); // Bits per sample
    
    // Sub-chunk 2: Core PCM Amplitude data
    writeAsciiString(view, 36, 'data');
    view.setUint32(40, byteLength, true);
    
    // Write actual sample frames downscaled to Int16
    convertFloatToInt16PCM(view, 44, interleavedSamples);
    
    return new Blob([view], { type: 'audio/wav' });
  };

  const interleaveChannelLines = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
    const totalSamples = inputL.length + inputR.length;
    const combined = new Float32Array(totalSamples);
    let outIdx = 0;
    let inIdx = 0;
    
    while (outIdx < totalSamples) {
      combined[outIdx++] = inputL[inIdx] || 0;
      combined[outIdx++] = inputR[inIdx] || 0;
      inIdx++;
    }
    return combined;
  };

  const writeAsciiString = (view: DataView, offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  const convertFloatToInt16PCM = (view: DataView, startOffset: number, samples: Float32Array) => {
    let offset = startOffset;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      // Clamp values and map to 16bit signed integer scale bounds
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  // Autoplay sample trigger for excellent immediate UX
  const triggerDemoTrial = () => {
    loadSampleTrack();
  };

  // Disconnect playing instance on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
        sourceNodeRef.current.disconnect();
      }
      if (playheadRafRef.current) {
        cancelAnimationFrame(playheadRafRef.current);
      }
    };
  }, []);

  return (
    <div id="audio-trimmer-workspace" className="max-w-[1300px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-brand-border/30">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-400 shadow-lg shadow-indigo-500/5">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono text-indigo-400 tracking-widest block uppercase">Apex Media Tools</span>
              <h1 className="text-3xl font-sans font-medium tracking-tight text-white mb-1">{l.title}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            {l.subtitle} &middot; {t.navigation.audioTrimmerDesc}
          </p>
        </div>

        {/* Trial Button */}
        {!decodedBuffer && (
          <button
            type="button"
            onClick={triggerDemoTrial}
            className="flex items-center gap-2 px-3.5 py-2 border border-[#6366f1]/40 hover:border-[#6366f1] bg-[#6366f1]/5 hover:bg-[#6366f1]/15 text-indigo-300 hover:text-indigo-200 text-xs font-mono rounded-xl transition duration-200 cursor-pointer"
          >
            <Sparkle className="w-3.5 h-3.5 text-indigo-400" />
            {l.sampleAudio}
          </button>
        )}
      </div>

      {/* Main interactive grid workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left container columns */}
        <div className="xl:col-span-8 space-y-5">
          {!decodedBuffer ? (
            /* Upload trigger landing pad */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 md:p-14 text-center transition-all ${
                onDrag 
                  ? 'border-indigo-400 bg-indigo-500/5 scale-[0.99] shadow-inner shadow-indigo-500/10' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-[#08080c]/50'
              }`}
            >
              <input
                type="file"
                id="audio-file-input"
                className="hidden"
                accept="audio/*"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 hover:border-indigo-500/30 transition-all mb-4 self-center shadow-lg shadow-black">
                  <Upload className="w-7 h-7 text-zinc-500 animate-bounce" />
                </div>
                
                <h3 className="text-base font-semibold text-zinc-200 tracking-tight">{l.uploadTitle}</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {l.uploadDesc}
                </p>
                
                <label
                  htmlFor="audio-file-input"
                  className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl tracking-wider uppercase transition shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 cursor-pointer inline-block"
                >
                  Select Audio Payload
                </label>
              </div>
            </div>
          ) : (
            /* Decoding state banner */
            <AnimatePresence>
              {isDecoding ? (
                <div className="p-8 bg-zinc-950 rounded-2xl border border-zinc-900 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest">{l.loadingMsg}</span>
                  
                  <div className="w-64 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${decodingProgress}%` }} />
                  </div>
                </div>
              ) : (
                /* Primary Audio Workspace Panel */
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 md:p-6 space-y-6 relative">
                  
                  {/* Waveform Visualization Canvas Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Visual Interactive Segment Spectrum</span>
                      </span>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-400 font-bold">{formatPreciseTime(currentTime)}</span>
                        <span className="text-zinc-600">/</span>
                        <span>{formatPreciseTime(decodedBuffer.duration)}</span>
                      </div>
                    </div>

                    {/* Canvas background area with custom cursors */}
                    <div ref={containerRef} className="bg-black/95 rounded-xl border border-zinc-900 relative overflow-hidden group">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="cursor-pointer block relative z-10"
                      />
                      
                      {/* Interactive Time rulers on hover */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 border border-zinc-800 rounded font-mono text-[9px] text-zinc-500 z-25 pointer-events-none uppercase">
                        Left: L | Right: R stereo channels
                      </div>
                    </div>
                    
                    {/* Zoom & Scrubber sliders */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 bg-[#060609] p-3 rounded-lg border border-zinc-900">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">{l.zoomLabel}{zoomFactor.toFixed(1)}</span>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="0.5"
                          value={zoomFactor}
                          onChange={(e) => setZoomFactor(parseFloat(e.target.value))}
                          className="w-24 md:w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      
                      <span className="text-[10px] font-mono text-zinc-500 italic block">
                        {l.zoomHint}
                      </span>
                    </div>
                  </div>

                  {/* Playback Controls & Utility Toolbar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-t border-b border-zinc-900 py-4">
                    
                    {/* Left: Stop, Play, Loop */}
                    <div className="md:col-span-5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => isPlaying ? stopPlayback() : playSelectionSegment(startTime)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition duration-200 cursor-pointer ${
                          isPlaying 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlaying ? 'Pause' : l.playRegion}</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopPlayback}
                        disabled={!isPlaying && currentTime === startTime}
                        className="p-2.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-40"
                        title={l.stopRegion}
                      >
                        <Square className="w-3.5 h-3.5 fill-zinc-400" />
                      </button>

                      {/* Loop toggler */}
                      <button
                        type="button"
                        onClick={() => setIsLooping(!isLooping)}
                        className={`px-3 py-2 rounded-xl border text-xs font-mono tracking-wider transition ${
                          isLooping 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/35 shadow-sm' 
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {l.loopLabel}: <span className="font-extrabold">{isLooping ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    {/* Middle: Volume */}
                    <div className="md:col-span-3 flex items-center gap-2 bg-[#090a0f] p-1.5 rounded-xl border border-zinc-900/60">
                      <button 
                        type="button" 
                        onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)} 
                        className="text-zinc-400 hover:text-white"
                      >
                        {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Right: Pitchspeed */}
                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">{l.speedLabel}</span>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="bg-[#030305] border border-zinc-950 px-2 py-1.5 rounded font-mono text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/40"
                      >
                        <option value="0.5">0.50x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.00x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.50x</option>
                        <option value="2.0">2.00x</option>
                      </select>
                    </div>

                  </div>

                  {/* Range Range Markers Dual Sliders */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#07070a] p-3 rounded-xl border border-zinc-900">
                      <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <span>{l.trimTitle}</span>
                      </h3>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={setStartToPlayhead}
                          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono transition cursor-pointer"
                        >
                          {l.setStartCur}
                        </button>
                        <button
                          type="button"
                          onClick={setEndToPlayhead}
                          className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 rounded text-[10px] font-mono transition cursor-pointer"
                        >
                          {l.setEndCur}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 bg-black/90 p-5 rounded-xl border border-zinc-900/80">
                      
                      {/* Multi Range Slider Simulator */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                          <span className="text-indigo-400 font-bold">Start: {formatPreciseTime(startTime)}</span>
                          <span className="text-cyan-400 font-bold">End: {formatPreciseTime(endTime)}</span>
                        </div>
                        
                        {/* Interactive sliders stacked cleanly */}
                        <div className="space-y-3 pt-1">
                          {/* Start handle */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-zinc-500 w-8">START</span>
                            <input
                              type="range"
                              min="0"
                              max={decodedBuffer.duration}
                              step="0.01"
                              value={startTime}
                              onChange={(e) => setClampedStartTime(parseFloat(e.target.value))}
                              className="flex-1 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-xs font-mono text-zinc-400 w-16 text-right">{startTime.toFixed(2)}s</span>
                          </div>

                          {/* End handle */}
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-zinc-500 w-8">END</span>
                            <input
                              type="range"
                              min="0"
                              max={decodedBuffer.duration}
                              step="0.01"
                              value={endTime}
                              onChange={(e) => setClampedEndTime(parseFloat(e.target.value))}
                              className="flex-1 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                            <span className="text-xs font-mono text-zinc-400 w-16 text-right">{endTime.toFixed(2)}s</span>
                          </div>
                        </div>
                      </div>

                      {/* Precise stepping increments */}
                      <div className="space-y-2 pt-2 border-t border-zinc-900">
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase tracking-wider">{l.preciseControls}</span>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Start steps */}
                          <div className="p-2.5 bg-[#090a0f] border border-zinc-900 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Left Clip (Start)</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setClampedStartTime(startTime - 0.5)}
                                className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded font-mono font-extrabold cursor-pointer text-zinc-300"
                              >
                                -0.5s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedStartTime(startTime - 0.1)}
                                className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded font-mono font-extrabold cursor-pointer text-zinc-300"
                              >
                                -0.1s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedStartTime(startTime + 0.1)}
                                className="px-1.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] text-indigo-300 rounded font-mono font-extrabold cursor-pointer"
                              >
                                +0.1s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedStartTime(startTime + 0.5)}
                                className="px-1.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-[10px] text-indigo-300 rounded font-mono font-extrabold cursor-pointer"
                              >
                                +0.5s
                              </button>
                            </div>
                          </div>

                          {/* End steps */}
                          <div className="p-2.5 bg-[#090a0f] border border-zinc-900 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Right Clip (End)</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setClampedEndTime(endTime - 0.5)}
                                className="px-1.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] text-cyan-300 rounded font-mono font-extrabold cursor-pointer"
                              >
                                -0.5s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedEndTime(endTime - 0.1)}
                                className="px-1.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] text-cyan-300 rounded font-mono font-extrabold cursor-pointer"
                              >
                                -0.1s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedEndTime(endTime + 0.1)}
                                className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded font-mono font-extrabold cursor-pointer text-zinc-300"
                              >
                                +0.1s
                              </button>
                              <button
                                type="button"
                                onClick={() => setClampedEndTime(endTime + 0.5)}
                                className="px-1.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] rounded font-mono font-extrabold cursor-pointer text-zinc-300"
                              >
                                +0.5s
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Right side information & download workspace */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Metadata ledger panel */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
              <Info className="w-4.5 h-4.5 text-indigo-400" />
              <span>{l.metaTitle}</span>
            </h3>

            {decodedBuffer ? (
              <div className="space-y-3 text-xs font-mono">
                {/* Duration */}
                <div className="flex justify-between p-2 bg-[#0a0a0d] border border-zinc-900 rounded-lg">
                  <span className="text-zinc-500 uppercase">{l.duration}</span>
                  <span className="text-white font-bold">{decodedBuffer.duration.toFixed(3)}s</span>
                </div>
                
                {/* Sample Rate */}
                <div className="flex justify-between p-2 bg-[#0a0a0d] border border-zinc-900 rounded-lg">
                  <span className="text-zinc-500 uppercase">{l.sampleRate}</span>
                  <span className="text-white font-bold">{decodedBuffer.sampleRate} Hz</span>
                </div>

                {/* Audioline Channels */}
                <div className="flex justify-between p-2 bg-[#0a0a0d] border border-zinc-900 rounded-lg">
                  <span className="text-zinc-500 uppercase">{l.channels}</span>
                  <span className="text-white font-bold">{decodedBuffer.numberOfChannels === 2 ? l.stereo : l.mono} ({decodedBuffer.numberOfChannels} ch)</span>
                </div>

                {/* File size metrics */}
                {file && (
                  <>
                    <div className="flex justify-between p-2 bg-[#0a0a0d] border border-zinc-900 rounded-lg">
                      <span className="text-zinc-500 uppercase">{l.originalSize}</span>
                      <span className="text-white font-bold">{formatBytes(file.size)}</span>
                    </div>

                    <div className="flex justify-between p-2 bg-indigo-950/20 border border-indigo-900/35 rounded-lg">
                      <span className="text-indigo-400 uppercase">{l.estimatedSize}</span>
                      <span className="text-indigo-300 font-bold">{formatBytes(estimatedCropWeight)}</span>
                    </div>
                  </>
                )}
                
                {/* Clear payload trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setDecodedBuffer(null);
                  }}
                  className="w-full py-2 border border-zinc-900 hover:border-red-950/40 bg-zinc-950 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer text-center text-[10px] uppercase font-bold tracking-widest mt-2 block"
                >
                  Disconnect Audio Payload
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-zinc-650 italic">
                No active audio file registered in browser sandbox directory.
              </div>
            )}
          </div>

          {/* Export controller trigger Card */}
          {decodedBuffer && (
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-2xl space-y-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Settings className="w-4.5 h-4.5 text-indigo-400" />
                <span>Compiler & Render Pipeline</span>
              </h3>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleExportTrimAction}
                  disabled={isExporting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:from-zinc-900 disabled:to-zinc-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-40"
                >
                  {isExporting ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Scissors className="w-4 h-4" />
                      <span>{l.exportBtn}</span>
                    </div>
                  )}
                </button>

                {/* Progress rendering details */}
                {isExporting && (
                  <p className="text-[10px] font-mono text-zinc-400 leading-relaxed text-center italic">
                    {l.exportingMsg}
                  </p>
                )}

                {/* Render compile Success or Download block */}
                {exportSuccess && exportUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono">{l.successMsg}</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">
                          File formatted correctly to standard uncompressed 16-bit 44.1kHz PCM WAV encoding.
                        </p>
                      </div>
                    </div>

                    <a
                      href={exportUrl}
                      download={`clipped_${file ? file.name.replace(/\.[^/.]+$/, "") : "apex_track"}.wav`}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs uppercase tracking-wider rounded-lg text-center transition flex items-center justify-center gap-2 cursor-pointer block box-border shadow-md shadow-emerald-600/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{l.downloadBtn}</span>
                    </a>
                  </motion.div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

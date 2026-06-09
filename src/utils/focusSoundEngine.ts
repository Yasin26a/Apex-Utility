/**
 * Focus Sound Engine using Web Audio API
 * Synthesizes ambient textures natively without using external network assets
 */

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeSources: {
  nodes: { stop?: () => void; disconnect?: () => void }[];
} = { nodes: [] };

let currentType: 'noise' | 'rain' | 'beats' | null = null;
let currentVolumeLevel = 0.5;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Compensate for loss of volume in brownian synthesis
  }
  return noiseBuffer;
}

export function stopFocusSound() {
  activeSources.nodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
    } catch (e) {}
    try {
      if (node.disconnect) node.disconnect();
    } catch (e) {}
  });
  activeSources.nodes = [];
  currentType = null;
}

export function setFocusSoundVolume(volume: number) {
  currentVolumeLevel = Math.max(0, Math.min(1, volume));
  if (masterGain) {
    // Exponential gain scaling for a natural volume curve
    masterGain.gain.setTargetAtTime(currentVolumeLevel * currentVolumeLevel, getAudioContext().currentTime, 0.02);
  }
}

export function startFocusSound(type: 'noise' | 'rain' | 'beats', volume: number = 0.5) {
  // Stop existing sound first
  stopFocusSound();
  
  const ctx = getAudioContext();
  currentType = type;
  currentVolumeLevel = volume;

  // Set up master gain node
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(currentVolumeLevel * currentVolumeLevel, ctx.currentTime);

  if (type === 'noise') {
    // Soft White Noise
    const source = ctx.createBufferSource();
    source.buffer = createWhiteNoiseBuffer(ctx);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, ctx.currentTime); // Filter high piercing tones

    source.connect(filter).connect(masterGain);
    source.start(0);

    activeSources.nodes.push(source, filter);

  } else if (type === 'rain') {
    // realistic organic rain synthesis
    const source = ctx.createBufferSource();
    source.buffer = createBrownNoiseBuffer(ctx);
    source.loop = true;

    // Rumble component (deep low rumble)
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(450, ctx.currentTime);

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.7, ctx.currentTime);

    // Raindrop patter component (mid-high soft crackling)
    const patterFilter = ctx.createBiquadFilter();
    patterFilter.type = 'bandpass';
    patterFilter.frequency.setValueAtTime(1400, ctx.currentTime);
    patterFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    const patterGain = ctx.createGain();
    patterGain.gain.setValueAtTime(0.35, ctx.currentTime);

    // Split and connect
    source.connect(rumbleFilter).connect(rumbleGain).connect(masterGain);
    source.connect(patterFilter).connect(patterGain).connect(masterGain);
    
    source.start(0);

    activeSources.nodes.push(source, rumbleFilter, rumbleGain, patterFilter, patterGain);

  } else if (type === 'beats') {
    // Stereo Binaural Focus Drone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, ctx.currentTime); // Left Channel Base

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(124.5, ctx.currentTime); // Right Channel Base (+4.5Hz Theta Beat)

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, ctx.currentTime); // Deep grounding hum

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.4, ctx.currentTime);

    const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    if (panner1 && panner2) {
      panner1.pan.setValueAtTime(-1, ctx.currentTime);
      panner2.pan.setValueAtTime(1, ctx.currentTime);

      osc1.connect(panner1).connect(masterGain);
      osc2.connect(panner2).connect(masterGain);
    } else {
      // Fallback if browser doesn't support StereoPanner
      osc1.connect(masterGain);
      osc2.connect(masterGain);
    }

    subOsc.connect(subGain).connect(masterGain);

    osc1.start(0);
    osc2.start(0);
    subOsc.start(0);

    activeSources.nodes.push(osc1, osc2, subOsc, subGain);
    if (panner1) activeSources.nodes.push(panner1);
    if (panner2) activeSources.nodes.push(panner2);
  }
}

export function getActiveFocusSound() {
  return currentType;
}

export function getFocusSoundVolume() {
  return currentVolumeLevel;
}

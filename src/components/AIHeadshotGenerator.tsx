import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Download, RefreshCw, Smile, Sliders, Palette, Check, Wand2 } from 'lucide-react';

interface AvatarPreset {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'curly' | 'bald';
  eyes: 'normal' | 'happy' | 'wink';
  mouth: 'smile' | 'laugh' | 'neutral';
  background: string;
  glasses: boolean;
}

export default function AIHeadshotGenerator() {
  const [skinColor, setSkinColor] = useState('#FDBA74'); // Warm tan default
  const [hairColor, setHairColor] = useState('#1E293B'); // Slate dark hair
  const [hairStyle, setHairStyle] = useState<'short' | 'long' | 'curly' | 'bald'>('short');
  const [eyesStyle, setEyesStyle] = useState<'normal' | 'happy' | 'wink'>('normal');
  const [mouthStyle, setMouthStyle] = useState<'smile' | 'laugh' | 'neutral'>('smile');
  const [glasses, setGlasses] = useState(false);
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #4F46E5, #06B6D4)'); // Cosmic indigo-cyan
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // SVG Render Helper
  const renderAvatarSVG = () => {
    return (
      <svg
        id="avatar-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        className="w-full h-full max-w-[280px] sm:max-w-[320px] rounded-2xl block border border-zinc-800 shadow-2xl"
      >
        {/* Background */}
        <defs>
          <linearGradient id="avatar-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bgGradient.match(/#\w+/g)?.[0] || '#4F46E5'} />
            <stop offset="100%" stopColor={bgGradient.match(/#\w+/g)?.[1] || '#06B6D4'} />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#avatar-bg)" />

        {/* Neck */}
        <rect x="175" y="240" width="50" height="70" fill={skinColor} rx="10" filter="brightness(0.9)" />

        {/* Head/Face Base */}
        <circle cx="200" cy="180" r="75" fill={skinColor} />

        {/* Hair Back layer */}
        {hairStyle === 'long' && (
          <path d="M120,180 Q120,300 150,320 Q200,340 250,320 Q280,300 280,180 Z" fill={hairColor} />
        )}

        {/* Eyes */}
        {eyesStyle === 'normal' && (
          <>
            <circle cx="175" cy="170" r="7" fill="#0F172A" />
            <circle cx="225" cy="170" r="7" fill="#0F172A" />
            <circle cx="177" cy="168" r="2.5" fill="#FFFFFF" />
            <circle cx="227" cy="168" r="2.5" fill="#FFFFFF" />
          </>
        )}
        {eyesStyle === 'happy' && (
          <>
            <path d="M165,175 Q175,160 185,175" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M215,175 Q225,160 235,175" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </>
        )}
        {eyesStyle === 'wink' && (
          <>
            <circle cx="175" cy="170" r="7" fill="#0F172A" />
            <circle cx="177" cy="168" r="2.5" fill="#FFFFFF" />
            <path d="M215,175 Q225,160 235,175" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Glasses */}
        {glasses && (
          <>
            <circle cx="175" cy="170" r="20" stroke="#F59E0B" strokeWidth="4.5" fill="none" />
            <circle cx="225" cy="170" r="20" stroke="#F59E0B" strokeWidth="4.5" fill="none" />
            <line x1="195" y1="170" x2="205" y2="170" stroke="#F59E0B" strokeWidth="4.5" />
          </>
        )}

        {/* Nose */}
        <path d="M200,175 L195,195 L205,195 Z" fill={skinColor} filter="brightness(0.85)" />

        {/* Mouth */}
        {mouthStyle === 'smile' && (
          <path d="M185,210 Q200,230 215,210" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        )}
        {mouthStyle === 'laugh' && (
          <path d="M180,205 Q200,240 220,205 Z" fill="#E11D48" stroke="#0F172A" strokeWidth="3" />
        )}
        {mouthStyle === 'neutral' && (
          <line x1="185" y1="215" x2="215" y2="215" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Hair Front layer */}
        {hairStyle === 'short' && (
          <path d="M125,160 Q200,80 275,160 Q265,110 200,110 Q135,110 125,160" fill={hairColor} />
        )}
        {hairStyle === 'curly' && (
          <path d="M125,160 C110,130 140,100 170,110 C190,90 220,90 230,110 C260,100 290,130 275,160 Q200,120 125,160" fill={hairColor} />
        )}
        {hairStyle === 'long' && (
          <path d="M125,160 Q200,110 275,160 Q270,130 200,130 Q130,130 125,160" fill={hairColor} />
        )}

        {/* Clothing */}
        <path d="M130,310 Q200,290 270,310 L300,400 L100,400 Z" fill="#1E1B4B" />
        <path d="M175,300 L200,325 L225,300 Z" fill={skinColor} />
      </svg>
    );
  };

  const handleDownload = () => {
    const svgElement = document.getElementById('avatar-svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(image, 0, 0, 800, 800);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = 'ai_developer_headshot.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const interpretPrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/avatar-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (response.ok && data.avatar) {
        setSkinColor(data.avatar.skin);
        setHairColor(data.avatar.hair);
        setHairStyle(data.avatar.hairStyle);
        setEyesStyle(data.avatar.eyes);
        setMouthStyle(data.avatar.mouth);
        setGlasses(data.avatar.glasses);
        setBgGradient(data.avatar.background);
      }
    } catch (err) {
      console.error(err);
      // Fallback random generation
      const skins = ['#FDBA74', '#F43F5E', '#FCD34D', '#A16207', '#E4E4E7'];
      const hairs = ['#1E293B', '#B45309', '#BE185D', '#047857', '#475569'];
      const styles: ('short' | 'long' | 'curly' | 'bald')[] = ['short', 'long', 'curly', 'bald'];
      const eyes: ('normal' | 'happy' | 'wink')[] = ['normal', 'happy', 'wink'];
      const mouths: ('smile' | 'laugh' | 'neutral')[] = ['smile', 'laugh', 'neutral'];
      const gradients = [
        'linear-gradient(135deg, #4F46E5, #06B6D4)',
        'linear-gradient(135deg, #EC4899, #F43F5E)',
        'linear-gradient(135deg, #059669, #10B981)',
        'linear-gradient(135deg, #1E1B4B, #312E81)',
      ];

      setSkinColor(skins[Math.floor(Math.random() * skins.length)]);
      setHairColor(hairs[Math.floor(Math.random() * hairs.length)]);
      setHairStyle(styles[Math.floor(Math.random() * styles.length)]);
      setEyesStyle(eyes[Math.floor(Math.random() * eyes.length)]);
      setMouthStyle(mouths[Math.floor(Math.random() * mouths.length)]);
      setGlasses(Math.random() > 0.5);
      setBgGradient(gradients[Math.floor(Math.random() * gradients.length)]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-headshot-generator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-brand animate-pulse" />
          <span>AI Vector Headshot &amp; Avatar Generator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Design high-contrast vector headshots or describe your look in plain text to let the Gemini model auto-compose custom professional avatar sets instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Settings */}
        <div className="lg:col-span-8 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          {/* Natural description interpreter */}
          <div className="space-y-2 pb-3 border-b border-zinc-900">
            <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Describe Yourself (AI Auto-Composer)</span>
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. 'A professional engineer with long brown hair, glasses, friendly smile and pink cosmic gradient'..."
                className="flex-1 bg-zinc-950 border border-zinc-900 text-sm font-sans text-zinc-300 rounded p-2 focus:outline-none focus:border-brand/45"
              />
              <button
                onClick={interpretPrompt}
                disabled={isGenerating}
                className="px-4 py-2 rounded bg-brand text-zinc-950 font-bold font-sans text-xs flex items-center gap-1 cursor-pointer hover:bg-brand-hover transition-all"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>Auto-Compose</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left col parameters */}
            <div className="space-y-3.5">
              <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand" />
                <span>Facial Features</span>
              </h3>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Hair Style</span>
                <div className="grid grid-cols-4 gap-1">
                  {(['short', 'long', 'curly', 'bald'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setHairStyle(s)}
                      className={`py-1 text-[10px] rounded border transition-all cursor-pointer uppercase font-mono ${
                        hairStyle === s
                          ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Eyes Expression</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['normal', 'happy', 'wink'] as const).map((e) => (
                    <button
                      key={e}
                      onClick={() => setEyesStyle(e)}
                      className={`py-1 text-[10px] rounded border transition-all cursor-pointer uppercase font-mono ${
                        eyesStyle === e
                          ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Mouth style</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['smile', 'laugh', 'neutral'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMouthStyle(m)}
                      className={`py-1 text-[10px] rounded border transition-all cursor-pointer uppercase font-mono ${
                        mouthStyle === m
                          ? 'bg-brand/10 border-brand/35 text-brand font-bold'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs bg-zinc-950/40 p-2.5 rounded border border-zinc-900">
                <span className="font-mono text-zinc-400">Wearing Glasses</span>
                <button
                  onClick={() => setGlasses(!glasses)}
                  className={`px-3 py-1 rounded text-[10px] uppercase font-mono font-bold transition-all border cursor-pointer ${
                    glasses ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {glasses ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Right col colors */}
            <div className="space-y-3.5">
              <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand" />
                <span>Color Customizations</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-zinc-400">Skin Tone</span>
                  <div className="flex gap-1.5">
                    {['#FDBA74', '#FCD34D', '#A16207', '#E4E4E7', '#F43F5E'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSkinColor(color)}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          skinColor === color ? 'border-brand scale-110 shadow' : 'border-zinc-900 hover:border-zinc-700'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-zinc-400">Hair Tint</span>
                  <div className="flex gap-1.5">
                    {['#1E293B', '#B45309', '#BE185D', '#047857', '#475569'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setHairColor(color)}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          hairColor === color ? 'border-brand scale-110 shadow' : 'border-zinc-900 hover:border-zinc-700'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Background Gradient Presets</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: 'Deep Cosmic', style: 'linear-gradient(135deg, #4F46E5, #06B6D4)' },
                      { name: 'Warm Sunset', style: 'linear-gradient(135deg, #EC4899, #F43F5E)' },
                      { name: 'Bio Emerald', style: 'linear-gradient(135deg, #059669, #10B981)' },
                      { name: 'Midnight Charcoal', style: 'linear-gradient(135deg, #1E1B4B, #111827)' },
                    ].map((g) => (
                      <button
                        key={g.name}
                        onClick={() => setBgGradient(g.style)}
                        className={`py-1 rounded text-[10px] font-mono transition-all border cursor-pointer ${
                          bgGradient === g.style
                            ? 'border-brand text-zinc-200'
                            : 'border-zinc-900 text-zinc-500 hover:text-zinc-400'
                        }`}
                        style={{ background: g.style }}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="lg:col-span-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between items-center min-h-[400px]">
          <div className="flex-1 flex items-center justify-center">
            {renderAvatarSVG()}
          </div>

          <div className="w-full space-y-2 pt-4">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded bg-brand hover:bg-brand-hover text-zinc-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Avatar PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

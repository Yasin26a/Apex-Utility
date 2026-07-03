import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface AdUnitProps {
  /**
   * Google AdSense Ad Slot ID (e.g., '1234567890')
   */
  slot: string;
  /**
   * Google AdSense Publisher Client ID. Defaults to Yasinalam67's publisher ID
   */
  client?: string;
  /**
   * Ad layout format. Options: 'auto', 'fluid', 'rectangle', 'horizontal', 'vertical'
   */
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  /**
   * Set to true to allow responsive full-width behavior
   */
  responsive?: 'true' | 'false';
  /**
   * Optional custom styles to apply to the ad unit container
   */
  style?: React.CSSProperties;
  /**
   * Optional CSS classes to append
   */
  className?: string;
}

/**
 * Advanced, responsive Google AdSense AdUnit Component for React SPAs.
 * Features automatic container bounds tracking, responsive layout class assignment,
 * and high-performance intersection-based lazy loading to maximize FCP / lighthouse scores.
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  slot,
  client = 'ca-pub-3493943620806779',
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDev, setIsDev] = useState(false);
  const [inView, setInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [adPushed, setAdPushed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 1. Detect environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.includes('run.app') || // Dev container URL
        host.includes('aistudio') ||
        process.env.NODE_ENV !== 'production'
      ) {
        setIsDev(true);
      }
    }
  }, []);

  // 2. High-performance Lazy Loading (IntersectionObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          // Once the ad unit is in view, we can stop observing to maintain the injected element state
          observer.unobserve(el);
        }
      },
      {
        rootMargin: '120px', // Pre-load slightly before coming onto the viewport
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  // 3. Responsive Auto-sizing Container Detection (ResizeObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof ResizeObserver === 'undefined') {
      // Fallback to traditional window resize tracking
      const handleResize = () => {
        if (el) {
          setDimensions({
            width: el.offsetWidth,
            height: el.offsetHeight,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.round(width),
        height: Math.round(height),
      });
    });

    resizeObserver.observe(el);
    return () => {
      resizeObserver.unobserve(el);
    };
  }, []);

  // 4. Safe live push of adsbygoogle on intersection
  useEffect(() => {
    if (isDev || !inView || adPushed) return;

    let active = true;

    // Execute immediately after React finishes painting the visible DOM node
    const timer = setTimeout(() => {
      if (!active) return;
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        setAdPushed(true);
      } catch (err) {
        console.warn('[AdUnit] AdSense injection deferred or encountered minor warning:', err);
        setHasError(true);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inView, isDev, adPushed]);

  // Helper: Categorize the current auto-sizing container width
  const getContainerCategory = (w: number) => {
    if (w === 0) return 'Measuring...';
    if (w < 480) return 'Mobile Screen (Auto)';
    if (w < 728) return 'Tablet/Small-width (Auto)';
    if (w < 970) return 'Standard Banner Width (728px)';
    return 'Desktop Large Leaderboard (970px)';
  };

  // Safe layout height guidelines based on format to prevent layout cumulative shifts (CLS)
  const getEstimatedHeight = () => {
    if (format === 'horizontal') return '90px';
    if (format === 'vertical') return '600px';
    if (format === 'rectangle') return '250px';
    return 'auto';
  };

  return (
    <div 
      ref={containerRef}
      id={`adsense-wrapper-${slot}`}
      className={`relative w-full overflow-hidden ${className}`}
    >
      {isDev ? (
        /* Highly detailed and visual Sandbox Overlay displaying real-time telemetry */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="my-6 mx-auto w-full p-4 rounded-2xl border border-dashed border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/90 text-center select-none max-w-4xl transition-all duration-300 hover:border-amber-500/40 shadow-xl"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${inView ? 'bg-emerald-500 animate-ping' : 'bg-zinc-700'}`} />
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-zinc-400 uppercase">
                AdSense Telemetry Dashboard
              </span>
            </div>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded-md">
                Slot ID: {slot}
              </span>
            </div>
          </div>

          {/* Core Telemetry Visualizers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            {/* Auto-Sizing Container Box */}
            <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40 text-left">
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Responsive Scale</div>
              <div className="text-xs font-mono font-bold text-amber-400">
                {dimensions.width > 0 ? `${dimensions.width}px × ${dimensions.height || 'Auto'}` : 'Detecting...'}
              </div>
              <div className="text-[9px] text-zinc-500 mt-1 font-sans">
                {getContainerCategory(dimensions.width)}
              </div>
            </div>

            {/* Performance Lazy-Load Box */}
            <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40 text-left">
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Lazy Load Engine</div>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${inView ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={`text-xs font-mono font-bold ${inView ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {inView ? 'LOADED (Active)' : 'PENDING SCROLL'}
                </span>
              </div>
              <div className="text-[9px] text-zinc-500 mt-1 font-sans">
                Loads 120px before entering viewport
              </div>
            </div>

            {/* Configured Layout Box */}
            <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40 text-left">
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">Ad Format Spec</div>
              <div className="text-xs font-mono font-bold text-indigo-400 uppercase">
                {format} {responsive === 'true' && '(Fluid)'}
              </div>
              <div className="text-[9px] text-zinc-500 mt-1 font-sans">
                Est. CLS height: {getEstimatedHeight()}
              </div>
            </div>
          </div>

          {/* Information Notice */}
          <div className="py-2.5 px-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-left">
            <p className="text-[11px] text-indigo-200/90 leading-relaxed font-sans">
              💡 <strong className="text-white font-medium">Automatic Sizing Check:</strong> Drag your browser window size to test responsive reflowing. The telemetry card above updates instantaneously as parent widths expand or shrink.
            </p>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between pt-2 mt-3 border-t border-zinc-800/60 text-[9px] font-mono text-zinc-500">
            <span>Publisher Client: {client}</span>
            <span>Target Platform: apexutility.live</span>
          </div>
        </motion.div>
      ) : (
        /* Production Ad Unit Container with high-performance intersection rendering and smooth animations */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="my-6 mx-auto w-full text-center overflow-hidden"
          style={{ minHeight: inView ? 'auto' : getEstimatedHeight() }}
        >
          {inView && (
            <>
              <div className="text-[9px] font-mono tracking-widest text-zinc-500 mb-1 uppercase">
                Advertisement
              </div>
              <ins
                className="adsbygoogle"
                style={{ ...style, width: '100%' }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
                key={`${slot}-${dimensions.width}`} // Refresh DOM nodes smoothly if container changes standard width steps
              />
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdUnit;

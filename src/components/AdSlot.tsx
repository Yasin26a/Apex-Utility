import React, { useEffect, useRef, useState } from 'react';
import { useConsent } from '../context/ConsentContext';
import { useToolRunning } from '../context/ToolRunningContext';

export interface AdSlotProps {
  slotId?: string;
  variant: 'in-content' | 'sidebar';
  className?: string;
}

// Global flag to track if dev warning has already logged once
let hasLoggedDevWarning = false;
let hasInjectedAdScript = false;

export const AdSlot: React.FC<AdSlotProps> = ({ slotId: propSlotId, variant, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adPushed, setAdPushed] = useState(false);

  const { consent } = useConsent();
  const { isToolRunning } = useToolRunning();

  // Publisher and Slot ID resolution from environment variables
  const publisherId =
    import.meta.env.VITE_ADSENSE_PUB_ID || 'ca-pub-3493943620806779';

  const slotId =
    propSlotId ||
    (variant === 'in-content'
      ? import.meta.env.VITE_ADSENSE_SLOT_INCONTENT
      : import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR) ||
    '';

  const isDev = Boolean(import.meta.env.DEV);

  // In development, or if publisherId or slotId are absent in production, render NOTHING
  const shouldDisableAds = isDev || !publisherId || !slotId;

  useEffect(() => {
    if (shouldDisableAds && !hasLoggedDevWarning) {
      if (isDev) {
        console.warn(
          '[AdSense] Ads are safely disabled in development mode to protect Core Web Vitals and ad policy.'
        );
      } else if (!slotId) {
        console.warn(
          `[AdSense] No slotId configured for variant "${variant}". Rendering null to avoid layout shift.`
        );
      }
      hasLoggedDevWarning = true;
    }
  }, [shouldDisableAds, isDev, slotId, variant]);

  // Lazy-load with IntersectionObserver (rootMargin: 200px)
  useEffect(() => {
    if (shouldDisableAds) return;

    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px'
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [shouldDisableAds]);

  // Load AdSense library once, only after consent is granted and after page load/idle
  useEffect(() => {
    if (shouldDisableAds) return;
    if (consent.ad_storage !== 'granted') return;
    if (hasInjectedAdScript) return;

    const injectScript = () => {
      if (document.querySelector('script[src*="adsbygoogle.js"]')) {
        hasInjectedAdScript = true;
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      document.head.appendChild(script);
      hasInjectedAdScript = true;
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(injectScript, { timeout: 2000 });
    } else {
      setTimeout(injectScript, 1000);
    }
  }, [consent.ad_storage, publisherId, shouldDisableAds]);

  // Push ad to AdSense queue only when visible, consented, tool NOT running, and not already pushed
  useEffect(() => {
    if (shouldDisableAds) return;
    if (!isVisible) return;
    if (adPushed) return;
    if (consent.ad_storage !== 'granted') return;
    if (isToolRunning) return; // Strict rule: never load or trigger ads while a network/stress test is running

    try {
      const win = window as any;
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
      setAdPushed(true);
    } catch (e) {
      // AdSense push errors are silently caught to prevent user impact
    }
  }, [isVisible, adPushed, consent.ad_storage, isToolRunning, shouldDisableAds]);

  // If ads are disabled in dev or slot ID is missing, return null (renders NOTHING, no empty box, no layout shift)
  if (shouldDisableAds) {
    return null;
  }

  // Exact reserved space with responsive min-height and CSS contain: layout to guarantee CLS < 0.1
  const containerClasses =
    variant === 'sidebar'
      ? 'hidden lg:flex flex-col items-center justify-center my-6 w-full max-w-[300px] min-h-[600px] bg-zinc-950/40 rounded-xl border border-zinc-900/60 p-2 overflow-hidden'
      : 'flex flex-col items-center justify-center my-8 w-full min-h-[250px] sm:min-h-[280px] bg-zinc-950/40 rounded-xl border border-zinc-900/60 p-3 overflow-hidden';

  return (
    <div
      ref={containerRef}
      className={`ad-container ${containerClasses} ${className}`}
      style={{ contain: 'layout' }}
      aria-label="Advertisement Sponsor"
    >
      <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 block text-center mb-1.5 select-none">
        Advertisement
      </span>

      {isVisible && consent.ad_storage === 'granted' && (
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: variant === 'sidebar' ? '600px' : '250px',
            textAlign: 'center'
          }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
          data-ad-format={variant === 'sidebar' ? 'vertical' : 'rectangle,horizontal'}
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
};

export default AdSlot;

import { useCallback } from 'react';
import { useConsent } from '../context/ConsentContext';

export interface AnalyticsEventMap {
  tool_start: { tool_id: string; tool_name?: string };
  tool_complete: { tool_id: string; duration_ms?: number };
  affiliate_click: { product_id: string; page: string };
  upgrade_click: { plan_id?: string; page: string };
}

/**
 * Strict Privacy-First Analytics Hook
 * Enforces Consent Mode v2: events are only dispatched when analytics_storage is granted.
 * Strictly avoids logging IP addresses, tool inputs, calculation outputs, or personal data.
 */
export function useAnalytics() {
  const { consent } = useConsent();

  const trackEvent = useCallback(
    <K extends keyof AnalyticsEventMap>(eventName: K, params: AnalyticsEventMap[K]) => {
      // Strictly gate on user consent
      if (consent.analytics_storage !== 'granted') {
        return;
      }

      try {
        // Dispatch to GA4 via gtag if available
        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', eventName, {
            ...params,
            // Prevent IP logging or user tracking
            anonymize_ip: true,
            send_to: 'G-QLFRSKQP91'
          });
        }

        // Dispatch custom DOM event for cookieless edge / Cloudflare Web Analytics
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('apex_analytics_event', {
              detail: { eventName, params, timestamp: Date.now() }
            })
          );
        }
      } catch (err) {
        // Silently swallow analytics errors to avoid impacting tool execution
      }
    },
    [consent.analytics_storage]
  );

  const trackToolStart = useCallback(
    (toolId: string, toolName?: string) => {
      trackEvent('tool_start', { tool_id: toolId, tool_name: toolName });
    },
    [trackEvent]
  );

  const trackToolComplete = useCallback(
    (toolId: string, durationMs?: number) => {
      trackEvent('tool_complete', { tool_id: toolId, duration_ms: durationMs });
    },
    [trackEvent]
  );

  const trackAffiliateClick = useCallback(
    (productId: string, page: string) => {
      trackEvent('affiliate_click', { product_id: productId, page });
    },
    [trackEvent]
  );

  const trackUpgradeClick = useCallback(
    (planId: string = 'pro', page: string) => {
      trackEvent('upgrade_click', { plan_id: planId, page });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackToolStart,
    trackToolComplete,
    trackAffiliateClick,
    trackUpgradeClick,
    isAnalyticsAllowed: consent.analytics_storage === 'granted'
  };
}

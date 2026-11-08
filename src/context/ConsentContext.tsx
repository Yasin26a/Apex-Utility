import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ConsentStatus = 'denied' | 'granted';

export interface ConsentState {
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
  analytics_storage: ConsentStatus;
}

interface ConsentContextType {
  consent: ConsentState;
  hasUserResponded: boolean;
  openCookieSettings: () => void;
  updateConsent: (updates: Partial<ConsentState>) => void;
  isCmpAvailable: boolean;
}

const DEFAULT_CONSENT: ConsentState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
};

const ConsentContext = createContext<ConsentContextType>({
  consent: DEFAULT_CONSENT,
  hasUserResponded: false,
  openCookieSettings: () => {},
  updateConsent: () => {},
  isCmpAvailable: false
});

const CONSENT_STORAGE_KEY = 'apex_consent_mode_v2';

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentState>(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ad_storage: parsed.ad_storage === 'granted' ? 'granted' : 'denied',
          ad_user_data: parsed.ad_user_data === 'granted' ? 'granted' : 'denied',
          ad_personalization: parsed.ad_personalization === 'granted' ? 'granted' : 'denied',
          analytics_storage: parsed.analytics_storage === 'granted' ? 'granted' : 'denied'
        };
      }
    } catch {}
    return DEFAULT_CONSENT;
  });

  const [hasUserResponded, setHasUserResponded] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const [isCmpAvailable, setIsCmpAvailable] = useState<boolean>(false);
  const [showFallbackModal, setShowFallbackModal] = useState<boolean>(false);

  // Synchronize Consent Mode v2 with gtag
  const syncWithGtag = useCallback((state: ConsentState) => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('consent', 'update', {
        ad_storage: state.ad_storage,
        ad_user_data: state.ad_user_data,
        ad_personalization: state.ad_personalization,
        analytics_storage: state.analytics_storage
      });
    }
  }, []);

  const updateConsent = useCallback((updates: Partial<ConsentState>) => {
    setConsent(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      syncWithGtag(updated);
      setHasUserResponded(true);
      return updated;
    });
  }, [syncWithGtag]);

  // Check for Google CMP (Privacy & messaging) or IAB TCF API availability
  useEffect(() => {
    const checkCmp = () => {
      const hasGoogleFc = typeof (window as any).googlefc !== 'undefined';
      const hasTcfApi = typeof (window as any).__tcfapi === 'function';
      setIsCmpAvailable(hasGoogleFc || hasTcfApi);
    };

    checkCmp();
    const timer = setInterval(checkCmp, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to standard IAB TCF v2.2 consent updates if CMP script triggers them
  useEffect(() => {
    if (typeof (window as any).__tcfapi === 'function') {
      try {
        (window as any).__tcfapi('addEventListener', 2, (tcData: any, success: boolean) => {
          if (success && tcData && tcData.eventStatus === 'useractioncomplete') {
            const purposeConsents = tcData.purpose?.consents || {};
            // Purpose 1: Store/access info on device (cookies)
            // Purpose 3/4: Personalized ads profile & selection
            // Purpose 7/8/9: Measure ad performance & content performance
            const adStorage = purposeConsents[1] ? 'granted' : 'denied';
            const analytics = purposeConsents[8] || purposeConsents[7] ? 'granted' : 'denied';
            const personalization = purposeConsents[3] && purposeConsents[4] ? 'granted' : 'denied';

            updateConsent({
              ad_storage: adStorage,
              ad_user_data: personalization,
              ad_personalization: personalization,
              analytics_storage: analytics
            });
          }
        });
      } catch {}
    }
  }, [updateConsent]);

  // Open Cookie Settings: prioritizes certified CMP; falls back to review modal
  const openCookieSettings = useCallback(() => {
    const win = window as any;
    if (win.googlefc && typeof win.googlefc.showRevocationMessage === 'function') {
      win.googlefc.showRevocationMessage();
      return;
    }

    if (win.googlefc && win.googlefc.callbackQueue) {
      win.googlefc.callbackQueue.push({
        'CONSENT_DATA_READY': () => {
          if (typeof win.googlefc.showRevocationMessage === 'function') {
            win.googlefc.showRevocationMessage();
          }
        }
      });
      return;
    }

    if (typeof win.__tcfapi === 'function') {
      try {
        win.__tcfapi('displayConsentUi', 2, () => {});
        return;
      } catch {}
    }

    // Fallback info modal if certified CMP is not active in the current session
    setShowFallbackModal(true);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasUserResponded,
        openCookieSettings,
        updateConsent,
        isCmpAvailable
      }}
    >
      {children}

      {/* Cookie Settings Modal Fallback (When Certified CMP is pending or blocked) */}
      {showFallbackModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-zinc-100">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Privacy &amp; Regulatory Compliance
              </span>
              <h2 id="cookie-settings-title" className="text-xl font-bold text-white tracking-tight">
                Cookie &amp; Privacy Preferences
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We strictly enforce Google Consent Mode v2. All advertising and analytics storage are set to <strong>denied</strong> by default until you grant permission.
              </p>
            </div>

            <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-200">Essential Client Storage</div>
                  <div className="text-[11px] text-zinc-500">Required for client-side tool execution, state caching, and offline DB.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">ALWAYS ACTIVE</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <div className="font-semibold text-zinc-200">Analytics Storage</div>
                  <div className="text-[11px] text-zinc-500">Anonymous tool event counting (tool_start, tool_complete, zero IP or payload logging).</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateConsent({ analytics_storage: consent.analytics_storage === 'granted' ? 'denied' : 'granted' })}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    consent.analytics_storage === 'granted'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {consent.analytics_storage.toUpperCase()}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-200">Advertising &amp; Personalization</div>
                  <div className="text-[11px] text-zinc-500">Google AdSense contextual and personalized ad delivery.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = consent.ad_storage === 'granted' ? 'denied' : 'granted';
                    updateConsent({
                      ad_storage: next,
                      ad_user_data: next,
                      ad_personalization: next
                    });
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    consent.ad_storage === 'granted'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {consent.ad_storage.toUpperCase()}
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/60 text-[11px] text-zinc-500 leading-relaxed">
              Google-certified Consent Management (CMP) can be dynamically presented on supported regional sessions (EEA, UK, Switzerland) via Google AdSense Privacy &amp; Messaging.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  updateConsent({
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                    analytics_storage: 'denied'
                  });
                  setShowFallbackModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                Deny All
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConsent({
                    ad_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                    analytics_storage: 'granted'
                  });
                  setShowFallbackModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-lg shadow-emerald-950"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => useContext(ConsentContext);

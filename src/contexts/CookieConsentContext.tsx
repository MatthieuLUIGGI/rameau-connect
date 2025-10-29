import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ConsentChoices = {
  necessary: true; // toujours vrai (cookies strictement nécessaires)
  analytics: boolean;
  marketing: boolean;
};

type CookieConsentContextValue = {
  consent: ConsentChoices;
  hasConsent: boolean; // indique si un choix a été enregistré
  setConsent: (choices: ConsentChoices) => void;
  acceptAll: () => void;
  rejectAll: () => void;
};

const DEFAULT_CONSENT: ConsentChoices = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const STORAGE_KEY = "cookie-consent:v1";
type StoredConsent = { v: 1; ts: number; choices: ConsentChoices };

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentChoices>(DEFAULT_CONSENT);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredConsent | ConsentChoices;
        // Compat: ancienne forme (seulement choices)
        if ((parsed as any).analytics !== undefined) {
          const choices = parsed as ConsentChoices;
          setConsentState({ ...DEFAULT_CONSENT, ...choices, necessary: true });
          setHasConsent(true);
          return;
        }
        const obj = parsed as StoredConsent;
        const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
        if (obj && obj.v === 1 && obj.choices && Date.now() - obj.ts < sixMonthsMs) {
          setConsentState({ ...DEFAULT_CONSENT, ...obj.choices, necessary: true });
          setHasConsent(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((choices: ConsentChoices) => {
    const toStore: StoredConsent = { v: 1, ts: Date.now(), choices };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, []);

  const setConsent = useCallback((choices: ConsentChoices) => {
    const normalized: ConsentChoices = { ...DEFAULT_CONSENT, ...choices, necessary: true };
    setConsentState(normalized);
    setHasConsent(true);
    persist(normalized);
  }, [persist]);

  const acceptAll = useCallback(() => {
    setConsent({ necessary: true, analytics: true, marketing: true });
  }, [setConsent]);

  const rejectAll = useCallback(() => {
    setConsent({ necessary: true, analytics: false, marketing: false });
  }, [setConsent]);

  const value = useMemo<CookieConsentContextValue>(() => ({
    consent,
    hasConsent,
    setConsent,
    acceptAll,
    rejectAll,
  }), [consent, hasConsent, setConsent, acceptAll, rejectAll]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}

// src/context/BillingContext.jsx
// Tracks the user's ProBite subscription + KotaBot credit balance app-wide.
// Mirrors UserStatusContext.jsx's "fetch on auth change" pattern.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { getMyBilling } from "../api/billing.api";
import { THEMES, applyTheme, FREE_THEME_ID } from "../hooks/useTheme";

const BLANK_CREDITS = {
  unlimited: false,
  credits: 100,
  creditsCap: 100,
  resetsAt: null,
};

const BLANK = {
  plan: "free",
  billingCycle: null,
  subscriptionStatus: "none",
  expiresAt: null,
  cancelAtPeriodEnd: false,
  credits: BLANK_CREDITS,
};

const BillingContext = createContext({
  ...BLANK,
  isProBite: false,
  isLoading: false,
  refresh: async () => {},
  applyCreditsUpdate: () => {},
});

function normalize(res) {
  return {
    plan: res?.plan ?? "free",
    billingCycle: res?.billing_cycle ?? null,
    subscriptionStatus: res?.subscription_status ?? "none",
    expiresAt: res?.expires_at ?? null,
    cancelAtPeriodEnd: !!res?.cancel_at_period_end,
    credits: {
      unlimited: !!res?.credits?.unlimited,
      credits: res?.credits?.credits ?? null,
      creditsCap: res?.credits?.credits_cap ?? null,
      resetsAt: res?.credits?.resets_at ?? null,
    },
  };
}

export function BillingProvider({ children }) {
  const auth = useAuth();
  const isAuth = auth?.isAuth ?? Boolean(auth?.user);

  const [data, setData] = useState(BLANK);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!isAuth) {
      setData(BLANK);
      return;
    }
    setIsLoading(true);
    try {
      const { data: res } = await getMyBilling();
      setData(normalize(res));
    } catch {
      // Network hiccup / cold start — keep whatever we last had rather
      // than flashing the user back to "Free" with 0 credits.
    } finally {
      setIsLoading(false);
    }
  }, [isAuth]);

  useEffect(() => {
    if (isAuth) fetchBilling();
    else setData(BLANK);
  }, [isAuth, fetchBilling]);

  /**
   * Theme gating (ProBite perk) — most themes are locked to ProBite; if
   * this account isn't (or is no longer) ProBite but has a locked theme
   * saved (e.g. subscription lapsed), revert to the free theme as soon as
   * we know the real plan. Runs here rather than in SettingsPanel so it
   * takes effect immediately rather than only once Settings is opened.
   */
  useEffect(() => {
    if (isLoading) return;
    const isProBite = data.plan === "probite";
    if (isProBite) return;
    const savedThemeId = localStorage.getItem("kb_theme");
    if (savedThemeId && savedThemeId !== FREE_THEME_ID) {
      const freeTheme = THEMES.find((t) => t.id === FREE_THEME_ID) || THEMES[0];
      localStorage.setItem("kb_theme", freeTheme.id);
      applyTheme(freeTheme);
    }
  }, [isLoading, data.plan]);

  /**
   * Called right after /ai/chat or /ai/chat/read-file returns its
   * `credits` block — updates the badge instantly without an extra
   * round trip to /billing/me.
   */
  const applyCreditsUpdate = useCallback((creditsRes) => {
    if (!creditsRes) return;
    setData((prev) => ({
      ...prev,
      credits: {
        unlimited: !!creditsRes.unlimited,
        credits: creditsRes.credits ?? prev.credits.credits,
        creditsCap: creditsRes.credits_cap ?? prev.credits.creditsCap,
        resetsAt: creditsRes.resets_at ?? prev.credits.resetsAt,
      },
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...data,
      isProBite: data.plan === "probite",
      isLoading,
      refresh: fetchBilling,
      applyCreditsUpdate,
    }),
    [data, isLoading, fetchBilling, applyCreditsUpdate]
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export const useBilling = () => useContext(BillingContext);

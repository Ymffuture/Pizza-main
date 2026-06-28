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

const BLANK_CREDITS = {
  unlimited: false,
  credits: 20,
  creditsCap: 20,
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

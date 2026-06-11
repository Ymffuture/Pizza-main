// src/context/UserStatusContext.jsx
// Manages account status: active | warned | restricted | suspended | banned
// Provides per-feature permission flags consumed by AccountStatusBanner + FeatureGate

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import axiosClient from "../api/axiosClient";

/* ─── Feature permission matrix ──────────────────────────────────────────────
   Every feature flag defaults to true (active) so normal users are unaffected.
   Degraded statuses progressively lock features bottom-up.
─────────────────────────────────────────────────────────────────────────────── */
export const FEATURE_PERMISSIONS = {
  active: {
    canAddToCart: true,
    canCheckout: true,
    canOrder: true,
    canUseWallet: true,
    canUseRewards: true,
    canChat: true,
    canViewOrders: true,
  },
  warned: {
    canAddToCart: true,
    canCheckout: true,
    canOrder: true,
    canUseWallet: true,
    canUseRewards: true,
    canChat: true,
    canViewOrders: true,
  },
  restricted: {
    canAddToCart: false,
    canCheckout: false,
    canOrder: false,
    canUseWallet: false,
    canUseRewards: false,
    canChat: true, // can still ask questions, just not order
    canViewOrders: true, // can see past orders
  },
  suspended: {
    canAddToCart: false,
    canCheckout: false,
    canOrder: false,
    canUseWallet: false,
    canUseRewards: false,
    canChat: false,
    canViewOrders: true,
  },
  banned: {
    canAddToCart: false,
    canCheckout: false,
    canOrder: false,
    canUseWallet: false,
    canUseRewards: false,
    canChat: false,
    canViewOrders: false,
  },
};

/* ─── Human-readable labels for each feature key ─────────────────────────── */
export const FEATURE_LABELS = {
  canAddToCart: "Add to Cart",
  canCheckout: "Checkout",
  canOrder: "Place Orders",
  canUseWallet: "Wallet",
  canUseRewards: "Rewards",
  canChat: "KotaBot",
  canViewOrders: "Order History",
};

/* ─── Status metadata ─────────────────────────────────────────────────────── */
export const STATUS_META = {
  active: { label: "Active", accent: "#4ade80", severity: 0 },
  warned: { label: "Warned", accent: "#fbbf24", severity: 1 },
  restricted: { label: "Restricted", accent: "#fb923c", severity: 2 },
  suspended: { label: "Suspended", accent: "#f87171", severity: 3 },
  banned: { label: "Banned", accent: "#ff2424", severity: 4 },
};

/* ─── Default / empty state ───────────────────────────────────────────────── */
const BLANK = {
  status: "active",
  reason: null, // human-readable reason from admin
  expiresAt: null, // ISO string — for suspended only
  affectedFeatures: [], // ["canOrder","canUseWallet", ...] derived list
  adminNote: null, // internal note (shown only to admin)
  appealed: false, // user already submitted appeal
};

const UserStatusContext = createContext({
  ...BLANK,
  features: FEATURE_PERMISSIONS.active,
  isLoading: false,
  refresh: async () => {},
});

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const VALID = Object.keys(FEATURE_PERMISSIONS);
const safe = (s) => (VALID.includes(s) ? s : "active");

/** Derive which feature keys are locked by comparing active vs current */
function deriveLocked(status) {
  const active = FEATURE_PERMISSIONS.active;
  const current = FEATURE_PERMISSIONS[status] || active;
  return Object.keys(active).filter((k) => active[k] && !current[k]);
}

Object.freeze(FEATURE_PERMISSIONS);
Object.freeze(FEATURE_LABELS);
Object.freeze(STATUS_META);

/* ─── Provider ───────────────────────────────────────────────────────────── */
export function UserStatusProvider({ children }) {
  const auth = useAuth();
  const isAuth = auth?.isAuth ?? auth?.isAuthenticated ?? Boolean(auth?.user);
  const user = auth?.user ?? null;

  const [data, setData] = useState(BLANK);
  const [isLoading, setIsLoading] = useState(false);

  /* Merge helper — accepts newer status changes from the API/interceptors */
  const mergeStatus = useCallback((incoming) => {
    const status = safe(incoming?.status);

    setData((prev) => ({
      ...prev,
      ...incoming,
      status,
      affectedFeatures: incoming?.affectedFeatures ?? deriveLocked(status),
    }));
  }, []);

  /* Fetch dedicated status endpoint */
  const fetchStatus = useCallback(async () => {
    if (!isAuth) {
      setData(BLANK);
      return;
    }

    setIsLoading(true);
    try {
      const { data: res } = await axiosClient.get("/users/me/status");
      const status = safe(
        res?.status ?? user?.status ?? user?.account_status ?? "active"
      );

      setData({
        status,
        reason: res?.reason ?? null,
        expiresAt: res?.expires_at ?? null,
        affectedFeatures: res?.affected_features ?? deriveLocked(status),
        adminNote: res?.admin_note ?? null,
        appealed: res?.appealed ?? false,
      });
    } catch (error) {
      // Graceful fallback: read status off the user object if available
      const fallback = safe(user?.status ?? user?.account_status ?? "active");
      setData((prev) => ({
        ...prev,
        status: fallback,
        affectedFeatures: deriveLocked(fallback),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [isAuth, user]);

  /* Sync on auth change */
  useEffect(() => {
    if (isAuth) fetchStatus();
    else setData(BLANK);
  }, [isAuth, fetchStatus]);

  /* ── Intercept account-status responses ── */
  useEffect(() => {
    const id = axiosClient.interceptors.response.use(
      (response) => response,
      (err) => {
        const d = err?.response?.data;
        const code = err?.response?.status;

        if ([401, 403, 423].includes(code) && d?.account_status) {
          const nextStatus = safe(d.account_status);
          mergeStatus({
            status: nextStatus,
            reason: d.reason ?? null,
            expiresAt: d.expires_at ?? null,
            affectedFeatures: d.affected_features ?? deriveLocked(nextStatus),
          });
        }

        return Promise.reject(err);
      }
    );

    return () => {
      axiosClient.interceptors.response.eject(id);
    };
  }, [mergeStatus]);

  const features = useMemo(
    () => FEATURE_PERMISSIONS[data.status] ?? FEATURE_PERMISSIONS.active,
    [data.status]
  );

  const value = useMemo(
    () => ({
      ...data,
      features,
      isLoading,
      refresh: fetchStatus,
    }),
    [data, features, isLoading, fetchStatus]
  );

  return (
    <UserStatusContext.Provider value={value}>
      {children}
    </UserStatusContext.Provider>
  );
}

/* ─── Consumers ──────────────────────────────────────────────────────────── */
export const useUserStatus = () => useContext(UserStatusContext);

/**
 * Convenience hook — returns true if a specific feature is allowed.
 * Usage:  const canOrder = useFeatureAllowed("canOrder");
 */
export function useFeatureAllowed(featureKey) {
  const { features } = useUserStatus();

  if (!(featureKey in features)) {
    console.warn(`[UserStatus] Unknown feature key: ${featureKey}`);
    return true;
  }

  return features[featureKey];
}

/**
 * Convenience hook for status-aware UI.
 */
export function useAccountStatus() {
  const {
    status,
    reason,
    expiresAt,
    affectedFeatures,
    adminNote,
    appealed,
    features,
    isLoading,
    refresh,
  } = useUserStatus();

  return {
    status,
    reason,
    expiresAt,
    affectedFeatures,
    adminNote,
    appealed,
    features,
    isLoading,
    refresh,
    isActive: status === "active",
    isWarned: status === "warned",
    isRestricted: status === "restricted",
    isSuspended: status === "suspended",
    isBanned: status === "banned",
  };
}

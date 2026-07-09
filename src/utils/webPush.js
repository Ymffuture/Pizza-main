// src/utils/webPush.js
//
// Wraps the browser Push API + the backend's /push endpoints. This is real
// OS-level push notifications (works even when KotaBites isn't open in a
// tab) — separate from the in-app notification bell, which only shows
// things while/when the app is actually open.
import axiosClient from "../api/axiosClient";

export const isPushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// urlBase64 → Uint8Array, required by pushManager.subscribe's applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Current permission state — "granted" | "denied" | "default". */
export const getPushPermission = () =>
  isPushSupported() ? Notification.permission : "unsupported";

/** Is this browser/device currently subscribed? (checks the SW's actual subscription, not just permission) */
export async function isPushSubscribed() {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

/**
 * Full opt-in flow: request permission (if needed) → subscribe via the
 * browser's push service → send the subscription to the backend so it
 * knows where to push to. Returns true on success.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error("Push notifications aren't supported in this browser.");

  const permission = Notification.permission === "granted"
    ? "granted"
    : await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was denied.");

  const reg = await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const { data } = await axiosClient.get("/push/vapid-public-key");
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });
  }

  const json = subscription.toJSON();
  await axiosClient.post("/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
    user_agent: navigator.userAgent.slice(0, 300),
  });

  return true;
}

/** Opt out — unsubscribes on this device and tells the backend to forget it. */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  try {
    await axiosClient.post("/push/unsubscribe", { endpoint });
  } catch {
    // Best-effort — the device-side unsubscribe already happened either way.
  }
}

/** Send yourself a test push, for verifying the setup works end-to-end. */
export async function sendTestPush() {
  const { data } = await axiosClient.post("/push/test");
  return data;
}

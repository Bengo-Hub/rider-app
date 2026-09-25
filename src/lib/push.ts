// Web push for riders (FCM). The Firebase setup lives centrally in notifications-service: this app
// asks it for the browser config at runtime (GET /push/web-config, the tenant's own Firebase
// project or the platform's), so the app carries no Firebase build settings. When push is not
// set up there, riders still see new jobs in Open jobs.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const NOTIFICATIONS_API = (
  process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL ?? "https://notificationsapi.codevertexafrica.com"
).replace(/\/$/, "");

interface WebPushConfig {
  api_key: string;
  auth_domain?: string;
  project_id: string;
  storage_bucket?: string;
  messaging_sender_id: string;
  app_id: string;
  vapid_key: string;
}

let configPromise: Promise<WebPushConfig | null> | null = null;

function tenantRef(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tenantSlug") || window.location.pathname.split("/")[1] || "";
}

/** The Firebase browser config for this tenant, or null when push is not set up. Cached per page load. */
export function loadPushConfig(): Promise<WebPushConfig | null> {
  if (!configPromise) {
    const ref = tenantRef();
    configPromise = fetch(`${NOTIFICATIONS_API}/api/v1/push/web-config?tenant=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => (body?.enabled ? (body.config as WebPushConfig) : null))
      .catch(() => null);
  }
  return configPromise;
}

/** Browser can do web push and the business has push set up. */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return false;
  }
  return (await loadPushConfig()) !== null;
}

function accessToken(): string | null {
  try {
    return JSON.parse(localStorage.getItem("rider-auth-storage") ?? "{}")?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Gets this device's FCM token (through the app's service worker, which shows the alert and opens
 * the job when tapped) and registers it with notifications-api for the signed-in rider. Call only
 * after notification permission is granted. Returns true when registered.
 */
export async function registerRiderPush(): Promise<boolean> {
  const cfg = await loadPushConfig();
  const bearer = accessToken();
  if (!cfg || !bearer || Notification.permission !== "granted") return false;
  try {
    const app: FirebaseApp =
      getApps()[0] ??
      initializeApp({
        apiKey: cfg.api_key,
        authDomain: cfg.auth_domain,
        projectId: cfg.project_id,
        storageBucket: cfg.storage_bucket,
        messagingSenderId: cfg.messaging_sender_id,
        appId: cfg.app_id,
      });
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(app), { vapidKey: cfg.vapid_key, serviceWorkerRegistration: registration });
    if (!token) return false;
    const res = await fetch(`${NOTIFICATIONS_API}/api/v1/push/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ token, platform: "web", provider: "fcm" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

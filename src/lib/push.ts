// Web push for riders. Push is configured centrally in notifications-service; this app asks it at
// runtime how to register (GET /push/web-config): kind "fcm" (a Firebase project, tenant's or the
// platform's) or kind "webpush" (the platform's standard Web Push key, no Firebase needed). The app
// carries no push build settings. When push is off, riders still see new jobs in Open jobs.
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

type PushSetup = { kind: "fcm"; config: WebPushConfig } | { kind: "webpush"; vapidPublicKey: string };

let configPromise: Promise<PushSetup | null> | null = null;

function tenantRef(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tenantSlug") || window.location.pathname.split("/")[1] || "";
}

/** How this tenant's devices register for push, or null when push is off. Cached per page load. */
export function loadPushConfig(): Promise<PushSetup | null> {
  if (!configPromise) {
    const ref = tenantRef();
    configPromise = fetch(`${NOTIFICATIONS_API}/api/v1/push/web-config?tenant=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body): PushSetup | null => {
        if (!body?.enabled) return null;
        if (body.kind === "webpush" && body.vapid_public_key) {
          return { kind: "webpush", vapidPublicKey: body.vapid_public_key as string };
        }
        if (body.config) return { kind: "fcm", config: body.config as WebPushConfig };
        return null;
      })
      .catch(() => null);
  }
  return configPromise;
}

/** base64url VAPID key to the byte array PushManager.subscribe expects. */
function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** This device's push token: an FCM token, or the browser's Web Push subscription as JSON. */
async function deviceToken(setup: PushSetup, registration: ServiceWorkerRegistration): Promise<{ token: string; provider: string } | null> {
  if (setup.kind === "webpush") {
    const sub =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(setup.vapidPublicKey),
      }));
    return { token: JSON.stringify(sub.toJSON()), provider: "webpush" };
  }
  const cfg = setup.config;
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
  const token = await getToken(getMessaging(app), { vapidKey: cfg.vapid_key, serviceWorkerRegistration: registration });
  return token ? { token, provider: "fcm" } : null;
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
  const setup = await loadPushConfig();
  const bearer = accessToken();
  if (!setup || !bearer || Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const device = await deviceToken(setup, registration);
    if (!device) return false;
    const res = await fetch(`${NOTIFICATIONS_API}/api/v1/push/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ token: device.token, platform: "web", provider: device.provider }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Web push for riders (FCM), same setup as notifications-ui. Firebase web config values are
// public client config, not secrets (the service-account key stays in notifications-api). A
// deployment without them simply has no push; riders still see new jobs in the app.
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
const NOTIFICATIONS_API =
  process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL ?? "https://notificationsapi.codevertexafrica.com";

export function isPushConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && vapidKey);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    isPushConfigured()
  );
}

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function firebaseMessaging(): Messaging | null {
  if (!isPushSupported()) return null;
  app = app ?? getApps()[0] ?? initializeApp(firebaseConfig);
  messaging = messaging ?? getMessaging(app);
  return messaging;
}

function accessToken(): string | null {
  try {
    return JSON.parse(localStorage.getItem("rider-auth-storage") ?? "{}")?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Gets this device's FCM token (through the app's service worker, which shows the notification
 * and opens the job when tapped) and registers it with notifications-api for the signed-in rider.
 * Call only after notification permission is granted. Returns true when registered.
 */
export async function registerRiderPush(): Promise<boolean> {
  const m = firebaseMessaging();
  const bearer = accessToken();
  if (!m || !bearer || Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const token = await getToken(m, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return false;
    const res = await fetch(`${NOTIFICATIONS_API.replace(/\/$/, "")}/api/v1/push/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ token, platform: "web", provider: "fcm" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

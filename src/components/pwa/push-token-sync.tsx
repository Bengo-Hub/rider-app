"use client";

import { useEffect } from "react";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { isPushSupported, registerRiderPush } from "@/lib/push";

/**
 * Re-registers this device's push token once per app start when the rider already allowed
 * notifications. FCM tokens rotate and a rider may sign in on a new tenant, so a one-time
 * registration in settings would silently stop delivering. Never prompts.
 */
export function PushTokenSync() {
  const setPushGranted = useNotificationPrefs((s) => s.setPushGranted);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    let cancelled = false;
    (async () => {
      if (!(await isPushSupported())) return;
      const ok = await registerRiderPush();
      if (!cancelled) setPushGranted(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [setPushGranted]);

  return null;
}

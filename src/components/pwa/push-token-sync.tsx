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
    if (!isPushSupported() || Notification.permission !== "granted") return;
    let cancelled = false;
    registerRiderPush().then((ok) => {
      if (!cancelled) setPushGranted(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [setPushGranted]);

  return null;
}

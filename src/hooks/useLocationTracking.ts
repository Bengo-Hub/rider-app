"use client";

import { useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface LocationTrackingOptions {
  tenantSlug: string;
  enabled: boolean;
  intervalMs?: number;
}

export function useLocationTracking({
  tenantSlug,
  enabled,
  intervalMs = 15_000,
}: LocationTrackingOptions) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const sendLocation = useCallback(
    async (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastSentRef.current < intervalMs) return;
      lastSentRef.current = now;

      try {
        await api.post(`/${tenantSlug}/tracking/rider/location`, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
        });
      } catch {
        // Silently fail — location updates are best-effort
      }
    },
    [tenantSlug, intervalMs],
  );

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      sendLocation,
      () => {
        // Geolocation error — ignore silently
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, sendLocation]);
}

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { api } from "@/lib/api";

interface LocationTrackingOptions {
  tenantSlug: string;
  enabled: boolean;
  intervalMs?: number;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

export function useLocationTracking({
  tenantSlug,
  enabled,
  intervalMs = 15_000,
}: LocationTrackingOptions) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const [position, setPosition] = useState<LocationState>({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    accuracy: null,
  });

  const sendLocation = useCallback(
    async (pos: GeolocationPosition) => {
      // Always update local state for map rendering
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        accuracy: pos.coords.accuracy,
      });

      // Throttle API calls
      const now = Date.now();
      if (now - lastSentRef.current < intervalMs) return;
      lastSentRef.current = now;

      try {
        await api.post(`/${tenantSlug}/tracking/rider/location`, {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
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

  return position;
}

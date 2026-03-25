"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

interface RouteApiResponse {
  coordinates: [number, number][];
  distance_meters: number;
  duration_seconds: number;
}

interface CachedRoute {
  coordinates: [number, number][];
  distance_meters: number;
  duration_seconds: number;
  fetchedAt: number;
  fromLat: number;
  fromLng: number;
}

export interface DeliveryRouteResult {
  coordinates: [number, number][] | null;
  distanceKm: number;
  durationMinutes: number;
  isFromCache: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

interface UseDeliveryRouteParams {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  taskId: string;
  phase: "pickup" | "dropoff";
  enabled?: boolean;
}

const CACHE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const REFETCH_DISTANCE_M = 500; // re-fetch when rider moves 500m

/** Haversine distance in meters between two GPS points. */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cacheKey(taskId: string, phase: string): string {
  return `route:${taskId}:${phase}`;
}

function readCache(taskId: string, phase: string): CachedRoute | null {
  try {
    const raw = localStorage.getItem(cacheKey(taskId, phase));
    if (!raw) return null;
    const parsed: CachedRoute = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(cacheKey(taskId, phase));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(
  taskId: string,
  phase: string,
  data: RouteApiResponse,
  fromLat: number,
  fromLng: number,
): void {
  try {
    const cached: CachedRoute = {
      coordinates: data.coordinates,
      distance_meters: data.distance_meters,
      duration_seconds: data.duration_seconds,
      fetchedAt: Date.now(),
      fromLat,
      fromLng,
    };
    localStorage.setItem(cacheKey(taskId, phase), JSON.stringify(cached));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function useDeliveryRoute({
  fromLat,
  fromLng,
  toLat,
  toLng,
  taskId,
  phase,
  enabled = true,
}: UseDeliveryRouteParams): DeliveryRouteResult {
  const [coordinates, setCoordinates] = useState<[number, number][] | null>(
    null,
  );
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const fetchCountRef = useRef(0);

  const applyRouteData = useCallback(
    (data: { coordinates: [number, number][]; distance_meters: number; duration_seconds: number }, cached: boolean) => {
      setCoordinates(data.coordinates);
      setDistanceKm(data.distance_meters / 1000);
      setDurationMinutes(data.duration_seconds / 60);
      setIsFromCache(cached);
      setError(null);
    },
    [],
  );

  const fetchRoute = useCallback(async () => {
    if (!enabled || !fromLat || !fromLng || !toLat || !toLng) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        from_lat: String(fromLat),
        from_lng: String(fromLng),
        to_lat: String(toLat),
        to_lng: String(toLng),
      });

      const data = await api.get<RouteApiResponse>(
        `/routing/route?${params.toString()}`,
      );

      writeCache(taskId, phase, data, fromLat, fromLng);
      lastFetchPosRef.current = { lat: fromLat, lng: fromLng };
      applyRouteData(data, false);
    } catch (err) {
      // Network error — fall back to cache
      const cached = readCache(taskId, phase);
      if (cached) {
        applyRouteData(cached, true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load route");
      }
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fromLat, fromLng, toLat, toLng, taskId, phase, applyRouteData]);

  // Initial load: try cache first, then fetch
  useEffect(() => {
    if (!enabled || !fromLat || !fromLng || !toLat || !toLng) return;

    const cached = readCache(taskId, phase);
    if (cached) {
      applyRouteData(cached, true);
      lastFetchPosRef.current = { lat: cached.fromLat, lng: cached.fromLng };
    }

    // Always fetch fresh data on first load
    fetchCountRef.current += 1;
    const currentFetch = fetchCountRef.current;

    // Small delay to avoid double-fetching during mount
    const timer = setTimeout(() => {
      if (fetchCountRef.current === currentFetch) {
        fetchRoute();
      }
    }, 100);

    return () => clearTimeout(timer);
    // Only run on mount/unmount or when task/phase changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, phase, enabled, toLat, toLng]);

  // Re-fetch when rider moves >500m from last fetch position
  useEffect(() => {
    if (
      !enabled ||
      !fromLat ||
      !fromLng ||
      !lastFetchPosRef.current
    )
      return;

    const dist = haversineMeters(
      lastFetchPosRef.current.lat,
      lastFetchPosRef.current.lng,
      fromLat,
      fromLng,
    );

    if (dist >= REFETCH_DISTANCE_M) {
      fetchRoute();
    }
  }, [enabled, fromLat, fromLng, fetchRoute]);

  const refresh = useCallback(() => {
    fetchRoute();
  }, [fetchRoute]);

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    isFromCache,
    isLoading,
    error,
    refresh,
  };
}

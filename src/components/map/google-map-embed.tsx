"use client";

import { Navigation } from "lucide-react";

interface GoogleMapEmbedProps {
  /** Directions origin — rider's current GPS position, falls back to the pickup location when unknown */
  originLat: number | null;
  originLng: number | null;
  /** Directions destination — pickup while isPickupPhase, dropoff otherwise */
  destLat: number | null;
  destLng: number | null;
  destLabel?: string;
  /** ETA in minutes from logistics API — Embed API has no own ETA, so this reuses the same value DeliveryMap shows */
  etaMinutes: number | null;
  distanceKm: number | null;
  className?: string;
}

/**
 * Renders live turn-by-turn directions in a real embedded Google Map, using Google's Maps Embed
 * API (a plain iframe — no JS SDK, no metered per-load billing the way the full Maps JavaScript
 * API has; Embed API stays on Google's always-free tier). This is the rider's primary map once a
 * task is assigned; GoogleMapsAvailable() below gates whether this component or the self-hosted
 * MapLibre/Valhalla DeliveryMap renders — see active-delivery-view.tsx.
 *
 * Trade-off accepted deliberately: the Embed API has no JS callback/event surface, so there is no
 * live-updating rider marker as they drive — Google re-renders the whole iframe's route only when
 * origin/destination props actually change. DeliveryMap (the fallback) still gets used for that
 * finer-grained live tracking when Google Maps isn't configured.
 */
export function GoogleMapEmbed({
  originLat,
  originLng,
  destLat,
  destLng,
  destLabel = "Destination",
  etaMinutes,
  distanceKm,
  className = "h-48 w-full rounded-xl overflow-hidden",
}: GoogleMapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (!apiKey || destLat === null || destLng === null) {
    return null;
  }

  const origin = originLat !== null && originLng !== null ? `${originLat},${originLng}` : null;
  const destination = `${destLat},${destLng}`;

  const src = origin
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=driving`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${destination}`;

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
  };

  return (
    <div className="relative">
      <iframe
        title={`Directions to ${destLabel}`}
        className={className}
        style={{ border: 0 }}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {(etaMinutes !== null || distanceKm !== null) && (
        <div className="absolute top-2 left-2 rounded-lg bg-black/70 px-3 py-1.5 text-white text-xs font-medium backdrop-blur-sm">
          {etaMinutes !== null && <span>{Math.round(etaMinutes)} min</span>}
          {etaMinutes !== null && distanceKm !== null && <span> &middot; </span>}
          {distanceKm !== null && <span>{distanceKm.toFixed(1)} km</span>}
        </div>
      )}

      <button
        onClick={openInGoogleMaps}
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-blue-500 shadow-md active:bg-blue-600"
        title="Open in Google Maps"
      >
        <Navigation className="size-4 text-white" />
      </button>
    </div>
  );
}

/** True when a Google Maps Embed API key is configured — the primary/fallback map switch reads this. */
export function googleMapsEmbedAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);
}

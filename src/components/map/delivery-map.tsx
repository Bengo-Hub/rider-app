"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Navigation, RotateCw } from "lucide-react";

interface DeliveryMapProps {
  /** Rider's current GPS position */
  riderLat: number | null;
  riderLng: number | null;
  riderHeading: number | null;
  /** Pickup location */
  pickupLat: number | null;
  pickupLng: number | null;
  pickupLabel?: string;
  /** Dropoff location */
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffLabel?: string;
  /** Whether rider is heading to pickup (true) or dropoff (false) */
  isPickupPhase: boolean;
  /** ETA in minutes from logistics API */
  etaMinutes: number | null;
  /** Distance in km from logistics API */
  distanceKm: number | null;
  /** Route coordinates [lng, lat][] from routing API */
  routeCoordinates?: [number, number][];
  /** CSS class */
  className?: string;
}

const TILE_STYLE = process.env.NEXT_PUBLIC_TILE_STYLE_URL ||
  "https://tiles.codevertexitsolutions.com/styles/osm-bright/style.json";

// Fallback to free OSM raster tiles if vector tile server unavailable
const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const NAIROBI_CENTER: [number, number] = [36.8219, -1.2921];

export function DeliveryMap({
  riderLat,
  riderLng,
  riderHeading,
  pickupLat,
  pickupLng,
  pickupLabel = "Pickup",
  dropoffLat,
  dropoffLng,
  dropoffLabel = "Dropoff",
  isPickupPhase,
  etaMinutes,
  distanceKm,
  routeCoordinates,
  className = "h-48 w-full rounded-xl overflow-hidden",
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropoffMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = riderLng && riderLat
      ? [riderLng, riderLat]
      : pickupLng && pickupLat
        ? [pickupLng, pickupLat]
        : NAIROBI_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center,
      zoom: 14,
      attributionControl: false,
    });

    // Fallback if tile server unreachable
    map.on("error", (e) => {
      if (e.error?.message?.includes("Failed to fetch") || e.error?.status === 404) {
        map.setStyle(FALLBACK_STYLE);
      }
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update rider marker
  useEffect(() => {
    if (!mapReady || !mapRef.current || !riderLat || !riderLng) return;

    if (!riderMarkerRef.current) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 4px rgba(0,0,0,0.3);"></div>`;
      riderMarkerRef.current = new maplibregl.Marker({ element: el.firstElementChild as HTMLElement })
        .setLngLat([riderLng, riderLat])
        .addTo(mapRef.current);
    } else {
      riderMarkerRef.current.setLngLat([riderLng, riderLat]);
    }

    if (riderHeading !== null) {
      const el = riderMarkerRef.current.getElement();
      el.style.transform = `rotate(${riderHeading}deg)`;
    }
  }, [mapReady, riderLat, riderLng, riderHeading]);

  // Update pickup marker
  useEffect(() => {
    if (!mapReady || !mapRef.current || !pickupLat || !pickupLng) return;

    if (!pickupMarkerRef.current) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`;
      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setText(pickupLabel);
      pickupMarkerRef.current = new maplibregl.Marker({ element: el.firstElementChild as HTMLElement })
        .setLngLat([pickupLng, pickupLat])
        .setPopup(popup)
        .addTo(mapRef.current);
    }
  }, [mapReady, pickupLat, pickupLng, pickupLabel]);

  // Update dropoff marker
  useEffect(() => {
    if (!mapReady || !mapRef.current || !dropoffLat || !dropoffLng) return;

    if (!dropoffMarkerRef.current) {
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`;
      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setText(dropoffLabel);
      dropoffMarkerRef.current = new maplibregl.Marker({ element: el.firstElementChild as HTMLElement })
        .setLngLat([dropoffLng, dropoffLat])
        .setPopup(popup)
        .addTo(mapRef.current);
    }
  }, [mapReady, dropoffLat, dropoffLng, dropoffLabel]);

  // Draw route line
  useEffect(() => {
    if (!mapReady || !mapRef.current || !routeCoordinates?.length) return;
    const map = mapRef.current;

    const sourceId = "delivery-route";
    const layerId = "delivery-route-line";

    const geojson: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: routeCoordinates },
    };

    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    } else {
      map.addSource(sourceId, { type: "geojson", data: geojson });
      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: { "line-color": "#3b82f6", "line-width": 4, "line-opacity": 0.8 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
    }

    // Fit map to route bounds
    const bounds = new maplibregl.LngLatBounds();
    routeCoordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
    if (riderLat && riderLng) bounds.extend([riderLng, riderLat]);
    map.fitBounds(bounds, { padding: 40, maxZoom: 16 });

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [mapReady, routeCoordinates, riderLat, riderLng]);

  const recenterMap = useCallback(() => {
    if (!mapRef.current || !riderLat || !riderLng) return;
    mapRef.current.flyTo({ center: [riderLng, riderLat], zoom: 15 });
  }, [riderLat, riderLng]);

  // Open native navigation (Google Maps / Apple Maps)
  const openNativeNav = useCallback(() => {
    const destLat = isPickupPhase ? pickupLat : dropoffLat;
    const destLng = isPickupPhase ? pickupLng : dropoffLng;
    if (destLat && destLng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, "_blank");
    }
  }, [isPickupPhase, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} />

      {/* ETA/Distance overlay */}
      {(etaMinutes !== null || distanceKm !== null) && (
        <div className="absolute top-2 left-2 rounded-lg bg-black/70 px-3 py-1.5 text-white text-xs font-medium backdrop-blur-sm">
          {etaMinutes !== null && <span>{Math.round(etaMinutes)} min</span>}
          {etaMinutes !== null && distanceKm !== null && <span> &middot; </span>}
          {distanceKm !== null && <span>{distanceKm.toFixed(1)} km</span>}
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
        <button
          onClick={recenterMap}
          className="flex size-8 items-center justify-center rounded-full bg-white shadow-md active:bg-gray-100"
          title="Re-center on my location"
        >
          <RotateCw className="size-4 text-gray-700" />
        </button>
        <button
          onClick={openNativeNav}
          className="flex size-8 items-center justify-center rounded-full bg-blue-500 shadow-md active:bg-blue-600"
          title="Open in Google Maps"
        >
          <Navigation className="size-4 text-white" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import type { ZoneShape } from "@bengo-hub/maps";

import { api } from "@/lib/api";
import { useOrgSlug } from "@/providers/org-slug-provider";

interface CoverageResponse {
  zones: { id: string; name: string; zone_type: string; color: string; boundary: number[][] }[];
}

/** The delivery area a job's drop-off falls in, from the tenant's logistics coverage. */
export function useDropoffZone(zoneId?: string | null): ZoneShape | null {
  const orgSlug = useOrgSlug();
  const { data } = useQuery({
    queryKey: ["delivery-coverage", orgSlug],
    queryFn: () => api.get<CoverageResponse>(`/${orgSlug}/zones/coverage`),
    enabled: !!orgSlug && !!zoneId,
    staleTime: 10 * 60_000,
  });
  const z = data?.zones?.find((x) => x.id === zoneId);
  return z ? { id: z.id, name: z.name, boundary: z.boundary, color: z.color, zoneType: z.zone_type } : null;
}

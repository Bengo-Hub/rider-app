"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RiderMeResponse } from "@/types/logistics";

export function useRiderProfile(tenantSlug: string) {
  return useQuery({
    queryKey: ["rider-me", tenantSlug],
    queryFn: () => api.get<RiderMeResponse>(`/${tenantSlug}/riders/me`),
    enabled: !!tenantSlug,
    staleTime: 1000 * 60 * 5,
  });
}

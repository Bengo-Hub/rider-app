"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FleetMember } from "@/types/logistics";

export function useRiderProfile(tenantSlug: string, memberId: string | undefined) {
  return useQuery({
    queryKey: ["rider-profile", tenantSlug, memberId],
    queryFn: () =>
      api.get<FleetMember>(`/${tenantSlug}/fleet-members/${memberId}`),
    enabled: !!tenantSlug && !!memberId,
    staleTime: 1000 * 60 * 10,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ACTIVE_STATUSES, type Task, type TaskListResponse } from "@/types/logistics";

interface UseActiveDeliveryOptions {
  tenantSlug: string;
  riderId: string | undefined;
}

export function useActiveDelivery({
  tenantSlug,
  riderId,
}: UseActiveDeliveryOptions) {
  return useQuery({
    queryKey: ["active-delivery", tenantSlug, riderId],
    queryFn: async (): Promise<Task | null> => {
      if (!riderId) return null;
      // /riders/me/tasks resolves the fleet member from the JWT server-side, so it
      // always scopes to the signed-in rider correctly. The generic /tasks list
      // endpoint has no rider_id query filter wired up at all (it takes status/
      // outlet only), and even if it did, `riderId` here is the auth user id, not
      // the fleet_member id assignments are actually keyed on -- either way a
      // ?rider_id= query param on /tasks was silently ignored, returning the
      // tenant's single most-recent task regardless of who it belonged to.
      const res = await api.get<TaskListResponse>(
        `/${tenantSlug}/riders/me/tasks?limit=20`,
      );
      // The first job the rider is working on (one list of active statuses for the app).
      const active = res.data?.find((t) => ACTIVE_STATUSES.includes(t.status));
      return active ?? null;
    },
    enabled: !!tenantSlug && !!riderId,
    refetchInterval: 15_000,
  });
}

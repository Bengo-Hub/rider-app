"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Task, TaskListResponse, ACTIVE_STATUSES } from "@/types/logistics";

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
      const res = await api.get<TaskListResponse>(
        `/${tenantSlug}/tasks?rider_id=${riderId}&limit=1`,
      );
      // Find the first non-completed, non-cancelled, non-failed, non-pending task
      const active = res.data?.find((t) =>
        ["assigned", "accepted", "en_route_pickup", "arrived_pickup", "picked_up", "en_route_dropoff", "arrived_dropoff"].includes(t.status),
      );
      return active ?? null;
    },
    enabled: !!tenantSlug && !!riderId,
    refetchInterval: 15_000,
  });
}

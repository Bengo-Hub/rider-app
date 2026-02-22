"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TaskListResponse, TaskStatus } from "@/types/logistics";

interface UseDeliveriesOptions {
  tenantSlug: string;
  status?: TaskStatus;
  riderId?: string;
  limit?: number;
  offset?: number;
}

export function useDeliveries({
  tenantSlug,
  status,
  riderId,
  limit = 20,
  offset = 0,
}: UseDeliveriesOptions) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (riderId) params.set("rider_id", riderId);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  return useQuery({
    queryKey: ["deliveries", tenantSlug, status, riderId, limit, offset],
    queryFn: () =>
      api.get<TaskListResponse>(
        `/${tenantSlug}/tasks?${params.toString()}`,
      ),
    enabled: !!tenantSlug,
  });
}

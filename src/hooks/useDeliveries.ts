"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Task, TaskListResponse, TaskStatus } from "@/types/logistics";

interface UseDeliveriesOptions {
  tenantSlug: string;
  status?: TaskStatus;
  riderId?: string;
  /**
   * When true, fetch the authenticated rider's own tasks via the
   * JWT-resolved endpoint (/riders/me/tasks) instead of the generic
   * /tasks list. This resolves the rider's FLEET MEMBER server-side, so no
   * rider_id param is needed (and filtering by auth user id is avoided).
   */
  mine?: boolean;
  limit?: number;
  offset?: number;
}

export function useDeliveries({
  tenantSlug,
  status,
  riderId,
  mine = false,
  limit = 20,
  offset = 0,
}: UseDeliveriesOptions) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (!mine && riderId) params.set("rider_id", riderId);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const basePath = mine ? "riders/me/tasks" : "tasks";

  return useQuery({
    queryKey: ["deliveries", tenantSlug, mine, status, riderId, limit, offset],
    queryFn: () =>
      api.get<TaskListResponse>(
        `/${tenantSlug}/${basePath}?${params.toString()}`,
      ),
    enabled: !!tenantSlug,
  });
}

export interface OpenJobsResponse {
  data: Task[];
  /** False when the business assigns every job from its dispatch board. */
  claim_enabled: boolean;
}

/**
 * Jobs no rider holds yet, which this rider can take (GET /riders/me/open-tasks). Polls so a
 * waiting rider sees new jobs without pulling to refresh.
 */
export function useOpenJobs(tenantSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["open-jobs", tenantSlug],
    queryFn: () => api.get<OpenJobsResponse>(`/${tenantSlug}/riders/me/open-tasks?limit=30`),
    enabled: !!tenantSlug && enabled,
    refetchInterval: 20_000,
  });
}

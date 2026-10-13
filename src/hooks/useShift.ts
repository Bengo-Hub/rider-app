"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** logistics shifts.Shift */
export interface RiderShift {
  id: string;
  shift_start: string;
  shift_end: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  zone_ids: string[];
}

/** GET /riders/me/shift: online while a shift is active. */
export interface MyShift {
  online: boolean;
  shift: RiderShift | null;
  next_shift: RiderShift | null;
}

const key = (tenantSlug: string) => ["my-shift", tenantSlug];

export function useMyShift(tenantSlug: string) {
  return useQuery({
    queryKey: key(tenantSlug),
    queryFn: () => api.get<MyShift>(`/${tenantSlug}/riders/me/shift`),
    enabled: !!tenantSlug,
    refetchInterval: 60_000,
  });
}

/** Go online (starts the scheduled shift, or an open-ended one) or offline (ends it now). */
export function useSetOnline(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (online: boolean) =>
      api.post<MyShift>(`/${tenantSlug}/riders/me/shift/${online ? "online" : "offline"}`, {}),
    onSuccess: (data) => qc.setQueryData(key(tenantSlug), data),
  });
}

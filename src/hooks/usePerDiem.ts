"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Per diem claim outcome logistics keeps on a task (metadata.per_diem_claim). */
export interface PerDiemClaim {
  status: "raised" | "skipped" | "failed";
  claim_id?: string;
  amount?: string;
  days?: number;
  code?: string;
  message?: string;
}

/** Reads the per diem outcome stored on a task, if any. */
export function perDiemOf(metadata: Record<string, unknown> | undefined): PerDiemClaim | null {
  const raw = metadata?.per_diem_claim;
  return raw && typeof raw === "object" ? (raw as PerDiemClaim) : null;
}

/**
 * Raises (or re-raises) a staff rider's per diem for a completed trip. HR payroll (erp-api)
 * decides the rate and eligibility; days of 0 lets HR count them from the trip.
 */
export function useRaisePerDiem(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, days }: { taskId: string; days: number }) =>
      api.post<PerDiemClaim>(`/${tenantSlug}/riders/me/tasks/${taskId}/per-diem`, days > 0 ? { days } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries", tenantSlug] }),
  });
}

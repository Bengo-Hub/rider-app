"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Task, TaskStatus } from "@/types/logistics";

export function useUpdateTaskStatus(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
      reason,
    }: {
      taskId: string;
      status: TaskStatus;
      reason?: string;
    }) =>
      api.patch<Task>(`/${tenantSlug}/tasks/${taskId}/status`, {
        status,
        reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

export function useAcceptTask(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) =>
      api.patch<Task>(`/${tenantSlug}/tasks/${taskId}/status`, {
        status: "accepted",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

/** Take an open job; it becomes this rider's and counts as accepted. 409 if someone got it first. */
export function useClaimTask(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) =>
      api.post<Task>(`/${tenantSlug}/riders/me/tasks/${taskId}/claim`, {}),
    onSettled: () => {
      // Refresh either way: on a 409 the job is gone and should drop off the list.
      qc.invalidateQueries({ queryKey: ["open-jobs"] });
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

export function useCancelTask(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason: string }) =>
      api.patch<{ message: string }>(
        `/${tenantSlug}/tasks/${taskId}/status`,
        { status: "cancelled", reason },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

export function useSubmitProof(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      proof,
    }: {
      taskId: string;
      proof: {
        confirmation_code?: string;
        photo_url?: string;
        recipient_name?: string;
        notes?: string;
        latitude?: number;
        longitude?: number;
        /** Cash-on-delivery: amount taken, how ("cash" | "mpesa") and the M-Pesa code. */
        amount_collected?: number;
        collection_method?: "cash" | "mpesa";
        collection_reference?: string;
      };
    }) =>
      api.post(`/${tenantSlug}/tasks/${taskId}/pod`, proof),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

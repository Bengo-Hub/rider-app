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
      api.put<Task>(`/${tenantSlug}/tasks/${taskId}/status`, {
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
      api.put<Task>(`/${tenantSlug}/tasks/${taskId}/status`, {
        status: "accepted",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

export function useCancelTask(tenantSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason: string }) =>
      api.post<{ message: string }>(
        `/${tenantSlug}/tasks/${taskId}/cancel`,
        { reason },
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
        delivery_code?: string;
        photo_url?: string;
        recipient_name?: string;
        notes?: string;
        latitude?: number;
        longitude?: number;
      };
    }) =>
      api.post(`/${tenantSlug}/deliveries/${taskId}/proof`, proof),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["active-delivery"] });
    },
  });
}

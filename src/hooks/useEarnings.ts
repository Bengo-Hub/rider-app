"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { api } from "@/lib/api";

export interface EarningsSummary {
  member_id: string;
  today: number;
  week: number;
  month: number;
  currency: string;
}

export interface EarningStatement {
  id: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  net_amount: number;
  status: "draft" | "confirmed" | "paid";
  created_at: string;
}

export interface BillingEvent {
  id: string;
  task_id: string;
  event_type: string;
  amount: number;
  currency: string;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export function useMyEarnings() {
  const orgSlug = useOrgSlug();
  return useQuery<EarningsSummary>({
    queryKey: ["my-earnings", orgSlug],
    queryFn: async () => {
      return api.get<EarningsSummary>(`/${orgSlug}/riders/me/earnings`);
    },
    enabled: !!orgSlug,
    staleTime: 60_000,
  });
}

export function useMyStatements() {
  const orgSlug = useOrgSlug();
  return useQuery<EarningStatement[]>({
    queryKey: ["my-statements", orgSlug],
    queryFn: async () => {
      return api.get<EarningStatement[]>(`/${orgSlug}/riders/me/earnings/statements`);
    },
    enabled: !!orgSlug,
    staleTime: 60_000,
  });
}

export function useMyBillingEvents() {
  const orgSlug = useOrgSlug();
  return useQuery<BillingEvent[]>({
    queryKey: ["my-billing-events", orgSlug],
    queryFn: async () => {
      return api.get<BillingEvent[]>(`/${orgSlug}/earnings/events`);
    },
    enabled: !!orgSlug,
    staleTime: 60_000,
  });
}

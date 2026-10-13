"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  generated_at: string;
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
      return api.get<BillingEvent[]>(`/${orgSlug}/riders/me/earnings/events`);
    },
    enabled: !!orgSlug,
    staleTime: 60_000,
  });
}

export interface CashDelivery {
  pod_id: string;
  task_id: string;
  order_number?: string;
  amount: number;
  delivered_at: string;
}

export interface RiderCash {
  fleet_member_id: string;
  held: number;
  deliveries: CashDelivery[];
  oldest_at?: string;
}

/** Cash on delivery this rider holds and must hand in at the outlet (GET /riders/me/cash). */
export function useMyCash() {
  const orgSlug = useOrgSlug();
  return useQuery({
    queryKey: ["my-cash", orgSlug],
    queryFn: () => api.get<RiderCash>(`/${orgSlug}/riders/me/cash`),
    enabled: !!orgSlug,
    refetchInterval: 60_000,
  });
}

/** Where the rider is paid (logistics payoutMethodResponse; account numbers come back masked). */
export interface PayoutMethod {
  payout_method: "mpesa_b2c" | "paystack_bank" | "paystack_mobile" | "cash" | "internal_wallet";
  payout_phone?: string;
  payout_bank_code?: string;
  payout_account_number?: string;
  payout_account_name?: string;
  payout_status: "active" | "suspended";
}

export interface SavePayoutMethod {
  payout_method: PayoutMethod["payout_method"];
  payout_phone?: string;
  payout_bank_code?: string;
  account_number?: string;
  account_name?: string;
}

export function useMyPayoutMethod() {
  const orgSlug = useOrgSlug();
  return useQuery<PayoutMethod>({
    queryKey: ["my-payout-method", orgSlug],
    queryFn: () => api.get<PayoutMethod>(`/${orgSlug}/riders/me/payout-method`),
    enabled: !!orgSlug,
  });
}

export function useSaveMyPayoutMethod() {
  const orgSlug = useOrgSlug();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SavePayoutMethod) => api.put<PayoutMethod>(`/${orgSlug}/riders/me/payout-method`, body),
    onSuccess: (data) => qc.setQueryData(["my-payout-method", orgSlug], data),
  });
}

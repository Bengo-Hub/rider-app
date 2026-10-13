"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Banknote, Clock, MapPin, Route } from "lucide-react";
import { api } from "@/lib/api";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StatusBadge } from "@/components/delivery/status-badge";
import { perDiemOf } from "@/hooks/usePerDiem";
import type { BillingEvent } from "@/hooks/useEarnings";
import type { Task } from "@/types/logistics";

// One past job: where it went, when each step happened, what it paid. Active jobs live on the
// active screen; this is the history view the "My jobs" list opens.

const when = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null;

export default function JobDetailPage() {
  const orgSlug = useOrgSlug();
  const { taskId } = useParams<{ taskId: string }>();

  const job = useQuery({
    queryKey: ["job", orgSlug, taskId],
    queryFn: () => api.get<Task>(`/${orgSlug}/tasks/${taskId}`),
    enabled: !!orgSlug && !!taskId,
  });
  const pay = useQuery({
    queryKey: ["job-pay", orgSlug, taskId],
    queryFn: () => api.get<BillingEvent[]>(`/${orgSlug}/riders/me/earnings/events?task_id=${taskId}`),
    enabled: !!orgSlug && !!taskId,
  });

  const t = job.data;
  const earned = (pay.data ?? []).reduce((sum, e) => sum + e.amount, 0);
  const perDiem = t ? perDiemOf(t.metadata) : null;
  const reason =
    (t?.metadata?.cancellation_reason as string | undefined) || (t?.metadata?.failure_reason as string | undefined);

  const steps = t
    ? [
        { label: "Assigned to you", at: t.assigned_at },
        { label: "Accepted", at: t.accepted_at },
        { label: "Picked up", at: t.picked_up_at },
        { label: t.status === "cancelled" ? "Cancelled" : "Finished", at: t.completed_at || t.cancelled_at },
      ].filter((s) => s.at)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href={orgRoute(orgSlug, "/deliveries")} aria-label="Back" className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">{t ? `Order ${t.order_number || t.tracking_code}` : "Job"}</h1>
      </header>

      <main className="flex-1 space-y-4 p-4">
        {job.isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        ) : job.isError || !t ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-600">
            This job is not available. It may have been given to another rider.
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <StatusBadge status={t.status} />
                {t.zone_name && <span className="text-xs text-gray-500">{t.zone_name}</span>}
              </div>
              {reason && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{reason}</p>}
              <div className="space-y-2 text-sm">
                <p className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{t.pickup_address || "Pickup"}</span>
                </p>
                <p className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{t.dropoff_address || "Drop-off"}</span>
                </p>
              </div>
              {(t.distance_km ?? 0) > 0 && (
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <Route className="h-3.5 w-3.5" /> {t.distance_km} km
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
              {steps.length === 0 ? (
                <p className="text-sm text-gray-500">No times recorded.</p>
              ) : (
                <ol className="space-y-2">
                  {steps.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" /> {s.label}
                      </span>
                      <span className="text-gray-500">{when(s.at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">Pay</h2>
              {perDiem ? (
                <p className="text-sm">
                  Per diem: {perDiem.status === "raised" ? `claimed${perDiem.amount ? `, KES ${perDiem.amount}` : ""}` : perDiem.message || perDiem.status}
                </p>
              ) : earned > 0 ? (
                <p className="flex items-center gap-2 text-sm">
                  <Banknote className="h-4 w-4 text-green-600" /> You earned <span className="font-semibold">KES {earned.toLocaleString()}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">No pay recorded for this job.</p>
              )}
              {(t.cash_on_delivery ?? 0) > 0 && (
                <p className="mt-1 text-xs text-gray-500">Cash collected from the customer: KES {(t.cash_on_delivery ?? 0).toLocaleString()}</p>
              )}
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

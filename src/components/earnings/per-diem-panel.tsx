"use client";

import { useState } from "react";
import { Briefcase, CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useDeliveries } from "@/hooks/useDeliveries";
import { perDiemOf, useRaisePerDiem, type PerDiemClaim } from "@/hooks/usePerDiem";
import type { Task } from "@/types/logistics";

// Staff riders are paid through HR payroll, not per delivery. Per diem for long trips is an
// HR expense claim: logistics reports the trip and HR applies the rate and approves it. This
// panel lists completed trips with the claim's state and lets the rider claim or re-claim.

function claimBadge(c: PerDiemClaim | null) {
  if (!c) return { text: "Not claimed", cls: "bg-gray-100 text-gray-600", Icon: Clock };
  if (c.status === "raised") return { text: c.amount ? `Claimed, KES ${c.amount}` : "Claimed", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 };
  if (c.status === "skipped") return { text: "Not eligible", cls: "bg-amber-100 text-amber-700", Icon: XCircle };
  return { text: "Could not reach HR", cls: "bg-red-100 text-red-700", Icon: RotateCcw };
}

export function PerDiemPanel({ tenantSlug }: { tenantSlug: string }) {
  const { data, isLoading, isError, refetch } = useDeliveries({ tenantSlug, status: "delivered", mine: true, limit: 30 });
  const trips: Task[] = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <Briefcase className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          You are on payroll, so deliveries do not earn per-trip pay. Per diem for long trips is claimed through HR:
          it is raised when you finish a trip, and HR sets the rate and approves it.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : isError ? (
        <button onClick={() => refetch()} className="w-full rounded-xl border bg-white p-4 text-sm text-red-600">
          Couldn&apos;t load your trips. Tap to retry.
        </button>
      ) : trips.length === 0 ? (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">No completed trips yet.</p>
      ) : (
        trips.map((t) => <TripRow key={t.id} task={t} tenantSlug={tenantSlug} />)
      )}
    </div>
  );
}

function TripRow({ task, tenantSlug }: { task: Task; tenantSlug: string }) {
  const claim = perDiemOf(task.metadata);
  const raise = useRaisePerDiem(tenantSlug);
  const [days, setDays] = useState("");
  const [open, setOpen] = useState(false);
  const badge = claimBadge(claim);
  // A raised claim lives in HR now; anything else can be (re)claimed, with days for a long trip.
  const canClaim = !claim || claim.status !== "raised";

  const submit = async () => {
    try {
      const res = await raise.mutateAsync({ taskId: task.id, days: Number(days) || 0 });
      if (res.status === "raised") toast.success("Per diem sent to HR");
      else toast.info(res.message || "HR did not accept this trip for per diem");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not claim per diem");
    }
  };

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{task.dropoff_address || task.order_number || task.tracking_code}</p>
          <p className="text-xs text-gray-500">
            {task.order_number || task.tracking_code}
            {task.zone_name ? ` · ${task.zone_name}` : ""}
            {task.distance_km ? ` · ${task.distance_km.toFixed(1)} km` : ""}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>
          <badge.Icon className="h-3 w-3" /> {badge.text}
        </span>
      </div>
      {claim?.status !== "raised" && claim?.message && <p className="mt-1 text-xs text-gray-500">{claim.message}</p>}
      {canClaim &&
        (open ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={60}
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Days (blank: HR counts)"
              className="h-10 flex-1 rounded-lg border px-3 text-sm"
            />
            <button
              onClick={submit}
              disabled={raise.isPending}
              className="flex h-10 items-center gap-1 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {raise.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Claim
            </button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-orange-600">
            {claim ? "Claim again" : "Claim per diem"}
          </button>
        ))}
    </div>
  );
}

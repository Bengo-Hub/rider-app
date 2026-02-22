"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StatusBadge } from "@/components/delivery/status-badge";
import { ArrowLeft, TrendingUp } from "lucide-react";

type Period = "today" | "week" | "month";

const PERIOD_TABS: { label: string; value: Period }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

export default function EarningsPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>("today");

  const { data, isLoading } = useDeliveries({
    tenantSlug: orgSlug,
    status: "completed",
    riderId: user?.id,
    limit: 50,
  });

  const completedTasks = data?.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={orgRoute(orgSlug, "/")}
            className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Earnings</h1>
        </div>
      </header>

      {/* Period Tabs */}
      <div className="flex gap-2 border-b bg-white px-4 py-2">
        {PERIOD_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setPeriod(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              period === t.value
                ? "bg-orange-500 text-white"
                : "border text-gray-500 active:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1 space-y-4 p-4">
        {/* Summary Card */}
        <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white">
          <p className="text-sm font-medium opacity-80">
            {period === "today"
              ? "Today's"
              : period === "week"
                ? "This Week's"
                : "This Month's"}{" "}
            Deliveries
          </p>
          <p className="mt-1 text-3xl font-bold">{completedTasks.length}</p>
          <div className="mt-3 flex items-center gap-2 text-sm opacity-80">
            <TrendingUp className="h-4 w-4" />
            <span>completed deliveries</span>
          </div>
        </div>

        {/* Completed Deliveries */}
        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent Completed</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : completedTasks.length > 0 ? (
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {task.customer_name || "Delivery"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {task.dropoff_address}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <StatusBadge status={task.status} />
                    {task.completed_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(task.completed_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              No completed deliveries yet. Start delivering to see your
              earnings!
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

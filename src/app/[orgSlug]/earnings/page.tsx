"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useMyEarnings, useMyStatements, useMyBillingEvents } from "@/hooks/useEarnings";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ArrowLeft, FileText, Clock } from "lucide-react";

type Tab = "overview" | "statements" | "history";

const TABS: { label: string; value: Tab }[] = [
  { label: "Overview", value: "overview" },
  { label: "Statements", value: "statements" },
  { label: "History", value: "history" },
];

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
};

function formatKES(amount: number | undefined): string {
  if (amount == null) return "—";
  return `KES ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EarningsPage() {
  const orgSlug = useOrgSlug();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: summary, isLoading: loadingSummary } = useMyEarnings();
  const { data: statements = [], isLoading: loadingStatements } = useMyStatements();
  const { data: events = [], isLoading: loadingEvents } = useMyBillingEvents();

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

      {/* Tabs */}
      <div className="flex gap-1 border-b bg-white px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === t.value
                ? "bg-orange-500 text-white"
                : "border text-gray-500 active:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1 space-y-4 p-4">
        {tab === "overview" && (
          <>
            {/* Summary card */}
            <div className="rounded-xl bg-linear-to-r from-green-500 to-emerald-600 p-5 text-white">
              {loadingSummary ? (
                <div className="h-16 animate-pulse rounded-lg bg-white/20" />
              ) : summary ? (
                <>
                  <p className="text-sm font-medium opacity-80">This Month</p>
                  <p className="mt-1 text-3xl font-bold">{formatKES(summary.month)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white/10 p-2">
                      <p className="opacity-70">Today</p>
                      <p className="font-semibold">{formatKES(summary.today)}</p>
                    </div>
                    <div className="rounded-lg bg-white/10 p-2">
                      <p className="opacity-70">This Week</p>
                      <p className="font-semibold">{formatKES(summary.week)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium opacity-80">No earnings data yet</p>
                  <p className="mt-1 text-2xl font-bold">KES 0.00</p>
                  <p className="mt-2 text-xs opacity-70">Complete deliveries to start earning</p>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-gray-500">Statements</p>
                <p className="mt-1 text-2xl font-bold">{statements.length}</p>
                <p className="text-xs text-gray-400">
                  {statements.filter((s) => s.status === "paid").length} paid
                </p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-gray-500">Pending Payout</p>
                <p className="mt-1 text-lg font-bold">
                  {formatKES(
                    statements
                      .filter((s) => s.status !== "paid")
                      .reduce((sum, s) => sum + (s.net_amount ?? 0), 0)
                  )}
                </p>
                <p className="text-xs text-gray-400">across {statements.filter((s) => s.status !== "paid").length} statements</p>
              </div>
            </div>
          </>
        )}

        {tab === "statements" && (
          <div className="rounded-xl border bg-white">
            <div className="flex items-center gap-2 border-b p-4">
              <FileText className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Earning Statements</h2>
            </div>
            {loadingStatements ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : statements.length > 0 ? (
              <div className="divide-y">
                {statements.map((stmt) => (
                  <div key={stmt.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(stmt.period_start)} – {formatDate(stmt.period_end)}
                      </p>
                      <p className="text-xs text-gray-500">Gross: {formatKES(stmt.gross_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatKES(stmt.net_amount)}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[stmt.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {stmt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-gray-500">
                No statements generated yet.
              </p>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="rounded-xl border bg-white">
            <div className="flex items-center gap-2 border-b p-4">
              <Clock className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Earnings History</h2>
            </div>
            {loadingEvents ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              </div>
            ) : events.length > 0 ? (
              <div className="divide-y">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {ev.event_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(ev.occurred_at)}</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      +{formatKES(ev.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-gray-500">
                No earnings events yet.
              </p>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

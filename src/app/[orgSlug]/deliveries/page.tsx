"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useDeliveries, useOpenJobs } from "@/hooks/useDeliveries";
import { useAcceptTask, useClaimTask } from "@/hooks/useTaskMutations";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import type { Task } from "@/types/logistics";

// Riders only ever see their own jobs and the open jobs they may take. The old "All" and
// "Available" tabs read the tenant-wide task list, which showed every other rider's jobs
// (customer names and addresses) and offered no way to take an unassigned one.
type TabFilter = "open" | "mine";

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Open jobs", value: "open" },
  { label: "My jobs", value: "mine" },
];

const PAGE_SIZE = 20;

export default function DeliveriesPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const [tab, setTab] = useState<TabFilter>("open");
  const [page, setPage] = useState(1);
  // Accumulated "My jobs" across the pages loaded so far.
  const [items, setItems] = useState<Task[]>([]);

  const openJobs = useOpenJobs(orgSlug, tab === "open");
  const mine = useDeliveries({
    tenantSlug: orgSlug,
    mine: true,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [tab]);

  // Page 1 replaces (tab switch, refetch); later pages append.
  useEffect(() => {
    if (!mine.data?.data) return;
    setItems((prev) => {
      if (page === 1) return mine.data.data;
      const seen = new Set(prev.map((t) => t.id));
      return [...prev, ...mine.data.data.filter((t) => !seen.has(t.id))];
    });
  }, [mine.data, page]);

  const acceptMutation = useAcceptTask(orgSlug);
  const claimMutation = useClaimTask(orgSlug);

  const handleAccept = (taskId: string) => {
    acceptMutation.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast.success("Delivery accepted!");
          router.push(orgRoute(orgSlug, "/active"));
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to accept"),
      },
    );
  };

  const handleClaim = (taskId: string) => {
    claimMutation.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast.success("Job taken. Head to the pickup point.");
          router.push(orgRoute(orgSlug, "/active"));
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not take this job"),
      },
    );
  };

  const active = tab === "open" ? openJobs : mine;
  const list: Task[] = tab === "open" ? (openJobs.data?.data ?? []) : items;
  const claimEnabled = openJobs.data?.claim_enabled ?? true;
  const hasMore = tab === "mine" && (mine.data?.hasMore ?? false);
  const total = tab === "mine" ? (mine.data?.total ?? items.length) : list.length;
  const showInitialLoader = active.isLoading && list.length === 0;
  const loadingMore = tab === "mine" && mine.isFetching && page > 1;

  const handleRefresh = () => {
    setPage(1);
    active.refetch();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={orgRoute(orgSlug, "/")}
              className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold">Deliveries</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={active.isRefetching}
            className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${active.isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="flex gap-2 border-b bg-white px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              tab === t.value ? "bg-orange-500 text-white" : "border text-gray-500 active:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4">
        {showInitialLoader ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : active.isError && list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">Couldn&apos;t load deliveries</h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              {active.error instanceof Error ? active.error.message : "Something went wrong. Please try again."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => active.refetch()}>
              Retry
            </Button>
          </div>
        ) : tab === "open" && !claimEnabled ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">Jobs are assigned by dispatch</h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              You will get a notification when a delivery is assigned to you.
            </p>
          </div>
        ) : list.length > 0 ? (
          <div className="space-y-3">
            {list.map((task) => (
              <DeliveryCard
                key={task.id}
                task={task}
                onAccept={tab === "mine" ? handleAccept : undefined}
                accepting={acceptMutation.isPending}
                onClaim={tab === "open" ? handleClaim : undefined}
                claiming={claimMutation.isPending}
                onView={tab === "mine" ? () => router.push(orgRoute(orgSlug, "/active")) : undefined}
              />
            ))}

            <div className="flex flex-col items-center gap-2 pt-2">
              {hasMore ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loadingMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              ) : null}
              {tab === "mine" && (
                <p className="py-1 text-center text-xs text-gray-400">
                  Showing {list.length} of {total}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">
              {tab === "open" ? "No open jobs" : "No deliveries"}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              {tab === "open"
                ? "New jobs appear here as soon as orders are ready. This list refreshes by itself."
                : "Jobs you take or are assigned will appear here."}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

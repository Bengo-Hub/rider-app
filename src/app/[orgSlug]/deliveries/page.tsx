"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAcceptTask } from "@/hooks/useTaskMutations";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import type { Task, TaskStatus } from "@/types/logistics";

type TabFilter = "all" | "pending" | "assigned";

const TABS: { label: string; value: TabFilter }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "pending" },
  { label: "My Tasks", value: "assigned" },
];

const PAGE_SIZE = 20;

export default function DeliveriesPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const [tab, setTab] = useState<TabFilter>("all");
  const [page, setPage] = useState(1);
  // Accumulated tasks across the pages loaded so far for the current tab.
  const [items, setItems] = useState<Task[]>([]);

  const statusFilter: TaskStatus | undefined =
    tab === "pending" ? "pending" : undefined;
  // "My Tasks" uses the JWT-resolved /riders/me/tasks endpoint (no rider_id);
  // the backend resolves the rider's fleet member from the token.
  const mine = tab === "assigned";

  const { data, isLoading, isFetching, isError, error, refetch, isRefetching } =
    useDeliveries({
      tenantSlug: orgSlug,
      status: statusFilter,
      mine,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });

  // Reset pagination + accumulated items whenever the tab changes.
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [tab]);

  // Merge each fetched page into the accumulated list. Page 1 replaces
  // (covers tab switch + manual refetch); later pages append.
  useEffect(() => {
    if (!data?.data) return;
    setItems((prev) => {
      if (page === 1) return data.data;
      const seen = new Set(prev.map((t) => t.id));
      return [...prev, ...data.data.filter((t) => !seen.has(t.id))];
    });
  }, [data, page]);

  const acceptMutation = useAcceptTask(orgSlug);

  const handleAccept = (taskId: string) => {
    acceptMutation.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast.success("Delivery accepted!");
          router.push(orgRoute(orgSlug, "/active"));
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to accept");
        },
      },
    );
  };

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  const hasMore = data?.hasMore ?? false;
  const total = data?.total ?? items.length;
  // Show full-screen spinner only on the very first load of a tab.
  const showInitialLoader = isLoading && items.length === 0;
  const loadingMore = isFetching && page > 1;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      {/* Header */}
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
            disabled={isRefetching}
            className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-gray-100"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b bg-white px-4 py-2">
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

      {/* Task List */}
      <main className="flex-1 p-4">
        {showInitialLoader ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : isError && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">
              Couldn&apos;t load deliveries
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              {error instanceof Error
                ? error.message
                : "Something went wrong. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((task) => (
              <DeliveryCard
                key={task.id}
                task={task}
                onAccept={handleAccept}
                accepting={acceptMutation.isPending}
                onView={() => router.push(orgRoute(orgSlug, "/active"))}
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
              <p className="py-1 text-center text-xs text-gray-400">
                Showing {items.length} of {total}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">
              No deliveries
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              {tab === "pending"
                ? "No available deliveries right now. Check back soon!"
                : tab === "assigned"
                  ? "You have no assigned tasks."
                  : "New delivery tasks will appear here."}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

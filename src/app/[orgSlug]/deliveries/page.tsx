"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useAcceptTask } from "@/hooks/useTaskMutations";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { BottomNav } from "@/components/layout/bottom-nav";
import { toast } from "sonner";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import type { TaskStatus } from "@/types/logistics";

type TabFilter = "all" | "pending" | "assigned";

const TABS: { label: string; value: TabFilter }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "pending" },
  { label: "My Tasks", value: "assigned" },
];

export default function DeliveriesPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<TabFilter>("all");

  const statusFilter: TaskStatus | undefined =
    tab === "pending" ? "pending" : undefined;
  const riderFilter = tab === "assigned" ? user?.id : undefined;

  const { data, isLoading, refetch, isRefetching } = useDeliveries({
    tenantSlug: orgSlug,
    status: statusFilter,
    riderId: riderFilter,
  });

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
            onClick={() => refetch()}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <div className="space-y-3">
            {data.data.map((task) => (
              <DeliveryCard
                key={task.id}
                task={task}
                onAccept={handleAccept}
                accepting={acceptMutation.isPending}
                onView={(id) =>
                  router.push(orgRoute(orgSlug, "/active"))
                }
              />
            ))}
            {data.total > data.data.length && (
              <p className="py-2 text-center text-xs text-gray-400">
                Showing {data.data.length} of {data.total}
              </p>
            )}
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

"use client";

import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { useUpdateTaskStatus, useCancelTask, useSubmitProof } from "@/hooks/useTaskMutations";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { ActiveDeliveryView } from "@/components/delivery/active-delivery-view";
import { BottomNav } from "@/components/layout/bottom-nav";
import { toast } from "sonner";
import { ArrowLeft, Package } from "lucide-react";
import type { TaskStatus } from "@/types/logistics";
import type { ProofOfDelivery } from "@/components/delivery/active-delivery-view";

export default function ActiveDeliveryPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((s) => s.user);

  const { data: activeTask, isLoading } = useActiveDelivery({
    tenantSlug: orgSlug,
    riderId: user?.id,
  });

  const gps = useLocationTracking({
    tenantSlug: orgSlug,
    enabled: !!activeTask,
  });

  const statusMutation = useUpdateTaskStatus(orgSlug);
  const cancelMutation = useCancelTask(orgSlug);
  const proofMutation = useSubmitProof(orgSlug);

  const handleAdvance = (taskId: string, nextStatus: TaskStatus) => {
    statusMutation.mutate(
      { taskId, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(`Status updated`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Update failed");
        },
      },
    );
  };

  const handleCancel = (taskId: string) => {
    if (!confirm("Are you sure you want to cancel this delivery?")) return;
    cancelMutation.mutate(
      { taskId, reason: "Cancelled by rider" },
      {
        onSuccess: () => {
          toast.success("Delivery cancelled");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Cancel failed");
        },
      },
    );
  };

  const handleSubmitProof = (taskId: string, proof: ProofOfDelivery) => {
    proofMutation.mutate(
      { taskId, proof },
      {
        onSuccess: () => {
          toast.success("Delivery completed!");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to submit proof");
        },
      },
    );
  };

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
          <h1 className="text-lg font-bold">Active Delivery</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : activeTask ? (
          <ActiveDeliveryView
            task={activeTask}
            onAdvanceStatus={handleAdvance}
            onCancel={handleCancel}
            onSubmitProof={handleSubmitProof}
            advancing={statusMutation.isPending}
            submittingProof={proofMutation.isPending}
            riderLat={gps.latitude}
            riderLng={gps.longitude}
            riderHeading={gps.heading}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">
              No active delivery
            </h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Accept a delivery from the queue to get started.
            </p>
            <Link
              href={orgRoute(orgSlug, "/deliveries")}
              className="mt-4 min-h-[44px] rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white active:bg-orange-600"
            >
              View Delivery Queue
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

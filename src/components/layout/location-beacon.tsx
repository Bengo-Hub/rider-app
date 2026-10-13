"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth-store";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useMyShift } from "@/hooks/useShift";
import { releasedByRider } from "@/hooks/useTaskMutations";
import type { Task } from "@/types/logistics";

/**
 * Sends the rider's location while they are online or working a job, on every screen. Auto-dispatch
 * only offers jobs to riders whose last position is fresh, so a rider waiting on the home screen
 * must keep reporting it (before this only the active-job screen did, and idle riders were never
 * offered work). Also tells the rider when a job they held is cancelled or moved to someone else.
 */
export function LocationBeacon() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((s) => s.user);
  const { data: shift } = useMyShift(orgSlug);
  const { data: activeTask } = useActiveDelivery({ tenantSlug: orgSlug, riderId: user?.id });

  useLocationTracking({ tenantSlug: orgSlug, enabled: !!shift?.online || !!activeTask });

  // A job that leaves the rider's active list without them finishing it.
  const heldRef = useRef<Task | null>(null);
  useEffect(() => {
    if (activeTask === undefined) return; // still loading
    const held = heldRef.current;
    heldRef.current = activeTask;
    if (!held || activeTask?.id === held.id || releasedByRider.has(held.id)) return;
    const label = held.order_number || held.tracking_code || "your job";
    api
      .get<Task>(`/${orgSlug}/tasks/${held.id}`)
      .then((t) => {
        if (t.status === "cancelled") toast.warning(`Order ${label} was cancelled. You do not need to deliver it.`, { duration: 10_000 });
        else if (["pending", "assigned", "accepted"].includes(t.status)) {
          toast.warning(`Order ${label} was given to another rider.`, { duration: 10_000 });
        }
      })
      .catch(() => {
        // The job is no longer readable by this rider: it was moved.
        toast.warning(`Order ${label} is no longer yours.`, { duration: 10_000 });
      });
  }, [activeTask, orgSlug]);

  return null;
}

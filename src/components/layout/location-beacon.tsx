"use client";

import { toast } from "sonner";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth-store";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { useMyShift } from "@/hooks/useShift";
import { useInboxStream } from "@/hooks/useInbox";

/**
 * App-wide rider background work:
 * - Sends the rider's location while they are online or working a job, on every screen.
 *   Auto-dispatch only offers jobs to riders whose last position is fresh, so a rider waiting on
 *   the home screen must keep reporting it.
 * - Keeps the inbox live and shows each new message (job assigned, moved, cancelled, payout).
 */
export function LocationBeacon() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((s) => s.user);
  const { data: shift } = useMyShift(orgSlug);
  const { data: activeTask } = useActiveDelivery({ tenantSlug: orgSlug, riderId: user?.id });

  useLocationTracking({ tenantSlug: orgSlug, enabled: !!shift?.online || !!activeTask });

  useInboxStream(orgSlug, (m) => {
    const warn = m.notification_type === "job_cancelled" || m.notification_type === "job_unassigned";
    (warn ? toast.warning : toast.success)(m.title, { description: m.body, duration: warn ? 10_000 : 6_000 });
  });

  return null;
}

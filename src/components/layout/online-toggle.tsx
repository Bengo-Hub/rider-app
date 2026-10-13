"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useMyShift, useSetOnline } from "@/hooks/useShift";

/** Online/offline switch. Online starts the rider's shift and offers them jobs; offline ends it. */
export function OnlineToggle() {
  const orgSlug = useOrgSlug();
  const { data, isLoading } = useMyShift(orgSlug);
  const setOnline = useSetOnline(orgSlug);
  const online = !!data?.online;
  const busy = isLoading || setOnline.isPending;

  const toggle = () => {
    const next = !online;
    if (next && typeof navigator !== "undefined" && navigator.geolocation) {
      // Ask for location now so the first fix goes out as soon as the rider is online.
      navigator.geolocation.getCurrentPosition(
        () => undefined,
        () => toast.error("Allow location so dispatch can offer you nearby jobs."),
      );
    }
    setOnline.mutate(next, {
      onSuccess: () => toast.success(next ? "You are online. New jobs will come to you." : "You are offline. No new jobs until you go online."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change your status"),
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={online}
      className={`ml-2 flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors disabled:opacity-60 ${
        online ? "border-green-500/30 bg-green-500/10" : "border-gray-300 bg-gray-100"
      }`}
    >
      {busy ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <span className={`size-2 rounded-full ${online ? "animate-pulse bg-green-500" : "bg-gray-400"}`} />
      )}
      <span className={`text-[10px] font-black uppercase tracking-tighter ${online ? "text-green-600" : "text-gray-500"}`}>
        {online ? "Online" : "Offline"}
      </span>
    </button>
  );
}

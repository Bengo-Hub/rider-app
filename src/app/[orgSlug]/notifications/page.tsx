"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Bell, CheckCheck, Package, PackageX, Repeat, Settings } from "lucide-react";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useInbox, useMarkAllRead, useMarkRead, type InboxMessage } from "@/hooks/useInbox";

// The rider's inbox: jobs assigned, moved to another rider or cancelled, and payouts sent.
// Messages arrive live (LocationBeacon keeps the stream open); this page lists them.

const ICONS: Record<string, typeof Bell> = {
  job_assigned: Package,
  job_unassigned: Repeat,
  job_cancelled: PackageX,
  payout_sent: Banknote,
};

const when = (s: string) => {
  const d = new Date(s);
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ago`;
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
};

export default function NotificationsPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useInbox(orgSlug);
  const markRead = useMarkRead(orgSlug);
  const markAll = useMarkAllRead(orgSlug);
  const items = data?.data ?? [];

  const open = (m: InboxMessage) => {
    if (!m.is_read) markRead.mutate(m.id);
    if (m.notification_type === "job_assigned") router.push(orgRoute(orgSlug, "/active"));
    else if (m.notification_type === "payout_sent") router.push(orgRoute(orgSlug, "/earnings"));
    else if (m.related_task_id) router.push(orgRoute(orgSlug, `/deliveries/${m.related_task_id}`));
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link href={orgRoute(orgSlug, "/")} aria-label="Back" className="rounded-lg p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-lg font-bold">Notifications</h1>
        {(data?.unread ?? 0) > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1 text-sm font-medium text-orange-600 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
        <Link href={orgRoute(orgSlug, "/settings/notifications")} aria-label="Notification settings" className="rounded-lg p-1 hover:bg-gray-100">
          <Settings className="h-5 w-5 text-gray-500" />
        </Link>
      </header>

      <main className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-600">
            Could not load notifications.{" "}
            <button className="font-medium text-orange-600" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="mb-3 h-12 w-12 text-gray-300" />
            <h2 className="text-base font-semibold text-gray-700">Nothing yet</h2>
            <p className="mt-1 max-w-xs text-sm text-gray-500">Jobs assigned to you, changes to your jobs and payouts show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {items.map((m) => {
              const Icon = ICONS[m.notification_type] ?? Bell;
              return (
                <button key={m.id} onClick={() => open(m)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50">
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.is_read ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-600"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${m.is_read ? "text-gray-700" : "font-semibold"}`}>{m.title}</span>
                    {m.body && <span className="block text-xs text-gray-500">{m.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-gray-400">{when(m.created_at)}</span>
                  </span>
                  {!m.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
                </button>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

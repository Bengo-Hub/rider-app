"use client";

import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveries, useOpenJobs } from "@/hooks/useDeliveries";
import { useClaimTask } from "@/hooks/useTaskMutations";
import { toast } from "sonner";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { useRouter } from "next/navigation";
import { Banknote, Package, Zap, DollarSign, Settings } from "lucide-react";
import { useMyCash, useMyEarnings } from "@/hooks/useEarnings";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import Image from "next/image";

import { Header } from "@/components/layout/header";

export default function RiderDashboard() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: brandConfig } = useBrandConfig();

  const { data: myCash } = useMyCash();
  const { data: earnings } = useMyEarnings();
  const cashCurrency = earnings?.currency || "KES";

  // Open jobs this rider may take (not the tenant-wide task list, which exposed other riders' jobs).
  const { data: openJobs } = useOpenJobs(orgSlug);
  const openList = openJobs?.data ?? [];
  const claimTask = useClaimTask(orgSlug);
  const handleClaim = (taskId: string) =>
    claimTask.mutate(
      { taskId },
      {
        onSuccess: () => {
          toast.success("Job taken. Head to the pickup point.");
          router.push(orgRoute(orgSlug, "/active"));
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not take this job"),
      },
    );

  const { data: activeTask } = useActiveDelivery({
    tenantSlug: orgSlug,
    riderId: user?.id,
  });

  // This rider's own deliveries (tasks end in "delivered"; "completed" is never used), counted for
  // today only. The previous query read every rider's tasks in a status nothing reaches, so it
  // always showed 0.
  const { data: myDelivered } = useDeliveries({
    tenantSlug: orgSlug,
    status: "delivered",
    mine: true,
    limit: 100,
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedCount = (myDelivered?.data ?? []).filter(
    (t) => new Date(t.completed_at ?? t.updated_at).getTime() >= todayStart.getTime(),
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <Header />

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Earnings Card - Premium Glassmorphism / Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Today&apos;s Summary</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-black">{completedCount}</p>
              <p className="text-sm font-bold opacity-80">Deliveries</p>
            </div>
            <p className="mt-1 text-[10px] font-black uppercase tracking-tighter opacity-70">
              Delivered today
            </p>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-4 -top-4 size-32 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Cash on delivery still to hand in at the outlet */}
        {(myCash?.held ?? 0) > 0 && (
          <div className="flex items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Banknote className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Cash to hand in
              </p>
              <p className="text-xl font-black text-foreground">
                {cashCurrency} {(myCash?.held ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">
                From {myCash?.deliveries.length ?? 0} cash deliver{myCash?.deliveries.length === 1 ? "y" : "ies"}. Hand it in at the outlet.
              </p>
            </div>
          </div>
        )}

        {/* Active Delivery Banner */}
        {activeTask && (
          <Link
            href={orgRoute(orgSlug, "/active")}
            className="group flex items-center gap-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-pulse">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-primary">
                Active Delivery
              </p>
              <p className="truncate font-bold text-foreground">
                {activeTask.dropoff_address || activeTask.customer_name}
              </p>
            </div>
            <span className="text-primary transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={orgRoute(orgSlug, "/deliveries")}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 shadow-inner">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-black tracking-tight text-foreground">Queue</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {openList.length} Open
              </p>
            </div>
          </Link>
          <Link
            href={orgRoute(orgSlug, "/earnings")}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 shadow-inner">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-black tracking-tight text-foreground">Earnings</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">History & PDF</p>
            </div>
          </Link>
        </div>

        {/* Available Deliveries */}
        <div className="pt-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">
              Available Work
            </h2>
            {openList.length > 3 && (
              <Link
                href={orgRoute(orgSlug, "/deliveries")}
                className="text-[10px] font-black uppercase tracking-widest text-primary"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          {openList.length > 0 ? (
            <div className="space-y-4">
              {openList.slice(0, 3).map((task) => (
                <DeliveryCard
                  key={task.id}
                  task={task}
                  onClaim={handleClaim}
                  claiming={claimTask.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <p className="mt-4 font-bold text-foreground opacity-50">
                {openJobs?.claim_enabled === false ? "Jobs are assigned by dispatch" : "No open jobs"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">
                {openJobs?.claim_enabled === false
                  ? "You will be notified when a delivery is assigned to you"
                  : "New jobs appear here as soon as orders are ready"}
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

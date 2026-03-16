"use client";

import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveries } from "@/hooks/useDeliveries";
import { useActiveDelivery } from "@/hooks/useActiveDelivery";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DeliveryCard } from "@/components/delivery/delivery-card";
import { useRouter } from "next/navigation";
import { Package, Zap, DollarSign, Settings } from "lucide-react";
import { useBrandConfig } from "@/hooks/useBrandConfig";
import Image from "next/image";

import { Header } from "@/components/layout/header";

export default function RiderDashboard() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: brandConfig } = useBrandConfig();

  const { data: pendingTasks } = useDeliveries({
    tenantSlug: orgSlug,
    status: "pending",
    limit: 5,
  });

  const { data: activeTask } = useActiveDelivery({
    tenantSlug: orgSlug,
    riderId: user?.id,
  });

  const { data: completedToday } = useDeliveries({
    tenantSlug: orgSlug,
    status: "completed",
    riderId: user?.id,
    limit: 50,
  });

  const completedCount = completedToday?.data?.length ?? 0;

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
              Target: 10 deliveries
            </p>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-4 -top-4 size-32 rounded-full bg-white/10 blur-3xl" />
        </div>

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
                {pendingTasks?.total ?? 0} Available
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
            {(pendingTasks?.total ?? 0) > 3 && (
              <Link
                href={orgRoute(orgSlug, "/deliveries")}
                className="text-[10px] font-black uppercase tracking-widest text-primary"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          {pendingTasks?.data && pendingTasks.data.length > 0 ? (
            <div className="space-y-4">
              {pendingTasks.data.slice(0, 3).map((task) => (
                <DeliveryCard
                  key={task.id}
                  task={task}
                  onView={() => {
                    router.push(orgRoute(orgSlug, "/deliveries"));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <p className="mt-4 font-bold text-foreground opacity-50">
                No deliveries available
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">
                Check back in a few minutes
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

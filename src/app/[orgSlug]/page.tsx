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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
               <Image 
                 src={brandConfig?.logoUrl || "/icons/rider-icon-192x192.png"} 
                 alt={brandConfig?.name || "Rider App"} 
                 width={24} 
                 height={24} 
                 className="rounded"
               />
            </div>
            <div>
              <h1 className="text-sm font-bold">
                {user?.name?.split(" ")[0] ?? "Rider"}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {brandConfig?.shortName || "Rider App"}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 uppercase">
            Online
          </span>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4">
        {/* Earnings Card */}
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
          <p className="text-sm font-medium opacity-80">Today&apos;s Summary</p>
          <p className="mt-1 text-3xl font-bold">
            {completedCount} delivery{completedCount !== 1 ? "ies" : "y"}
          </p>
          <p className="mt-1 text-sm opacity-80">completed today</p>
        </div>

        {/* Active Delivery Banner */}
        {activeTask && (
          <Link
            href={orgRoute(orgSlug, "/active")}
            className="flex items-center gap-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-4 active:bg-orange-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-800">
                Active Delivery
              </p>
              <p className="truncate text-xs text-orange-600">
                {activeTask.dropoff_address || activeTask.customer_name}
              </p>
            </div>
            <span className="text-orange-400">&rarr;</span>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={orgRoute(orgSlug, "/deliveries")}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 active:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Queue</p>
              <p className="text-xs text-gray-500">
                {pendingTasks?.total ?? 0} pending
              </p>
            </div>
          </Link>
          <Link
            href={orgRoute(orgSlug, "/earnings")}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 active:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Earnings</p>
              <p className="text-xs text-gray-500">View history</p>
            </div>
          </Link>
        </div>

        {/* Available Deliveries */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Available Deliveries</h2>
            {(pendingTasks?.total ?? 0) > 3 && (
              <Link
                href={orgRoute(orgSlug, "/deliveries")}
                className="text-xs font-medium text-orange-500"
              >
                View all
              </Link>
            )}
          </div>

          {pendingTasks?.data && pendingTasks.data.length > 0 ? (
            <div className="space-y-3">
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
            <div className="rounded-xl border bg-card p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                No deliveries available right now
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { Home, Package, DollarSign, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "" },
  { label: "Deliveries", icon: Package, path: "/deliveries" },
  { label: "Earnings", icon: DollarSign, path: "/earnings" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const orgSlug = useOrgSlug();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe">
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map((item) => {
          const href = `/${orgSlug}${item.path}`;
          const isActive =
            item.path === ""
              ? pathname === `/${orgSlug}` || pathname === `/${orgSlug}/`
              : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useAuthStore } from "@/store/auth-store";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  ArrowLeft,
  User,
  LogOut,
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  UserCog,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const orgSlug = useOrgSlug();
  const { user, logout } = useAuthStore();
  const isPending = user?.status === "pending" || user?.status === "pending_review";

  const handleLogout = () => {
    logout();
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
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4">
        {/* Profile Card */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <User className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{user?.name ?? user?.fullName ?? "Rider"}</p>
              <p className="truncate text-sm text-gray-500">{user?.email}</p>
            </div>
            {isPending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                <AlertCircle className="h-3 w-3" />
                Pending
              </span>
            )}
            {user?.status === "active" && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Profile Completion CTA (shown when pending) */}
        {isPending && (
          <Link
            href={orgRoute(orgSlug, "/profile")}
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 active:bg-orange-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
              <UserCog className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">Complete Your Profile</p>
              <p className="text-xs text-orange-600">
                Add vehicle details and documents to get approved faster.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-orange-400" />
          </Link>
        )}

        {/* Menu Items */}
        <div className="rounded-xl border bg-white divide-y">
          <MenuItemLink
            icon={UserCog}
            label="Edit Profile"
            href={orgRoute(orgSlug, "/profile")}
          />
          <MenuItem icon={Bell} label="Notifications" />
          <MenuItem icon={Shield} label="Privacy & Security" />
          <MenuItem icon={HelpCircle} label="Help & Support" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 active:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <p className="text-center text-xs text-gray-400">
          Rider App v0.1.0 &middot; {orgSlug}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

function MenuItem({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50">
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </button>
  );
}

function MenuItemLink({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
    >
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </Link>
  );
}

"use client";

import { useEffect } from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { fetchMe } from "@/lib/auth-api";

export default function AuthPendingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // Poll for status changes (e.g., admin approves the rider)
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        const profile = await fetchMe(accessToken);
        const u = profile.user ?? profile;
        setUser(u);

        if (u.status !== "pending" && u.status !== "pending_review") {
          const orgSlug =
            (typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null) ??
            process.env.NEXT_PUBLIC_TENANT_SLUG ??
            "urban-loft";
          router.replace(`/${orgSlug}/profile`);
        }
      } catch {
        // Ignore polling errors
      }
    }, 15_000); // Check every 15s

    return () => clearInterval(interval);
  }, [accessToken, setUser, router]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
        <Clock className="size-8 text-orange-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Account Pending Review</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your rider account is being reviewed by an administrator. You&apos;ll
          be able to access the app once your account is approved.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4 w-full max-w-xs">
        <p className="text-sm font-medium">{user.name || user.fullName || "Rider"}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <p className="mt-2 inline-block rounded-full bg-orange-100 px-3 py-0.5 text-xs font-medium text-orange-700 capitalize">
          {user.status ?? "pending"}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Check again
        </button>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        This page checks automatically every 15 seconds.
      </p>
    </div>
  );
}

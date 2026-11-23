"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth-store";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRiderProfile } from "@/hooks/useRiderProfile";
import { AccessModal } from "./AccessModal";
import { PendingReviewBanner } from "./PendingReviewBanner";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { user, redirectToSSO } = useAuthStore();
  const pathname = usePathname();
  const orgSlug = useOrgSlug();
  const membership = useRiderProfile(isAuthenticated ? orgSlug : "");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to SSO login with the correct tenant slug
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      void redirectToSSO(path, orgSlug);
    }
  }, [isLoading, isAuthenticated, redirectToSSO, orgSlug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Allow access to the profile page even if unapproved or non-rider
  // This allows users to complete their registration/KYC
  const isProfilePage = pathname?.includes("/profile");
  if (isProfilePage) {
    return <>{children}</>;
  }

  // Access follows the rider's fleet membership in logistics (/riders/me), not the SSO
  // profile: SSO status is the account's, and riders may sign in with a rider, driver or
  // courier role. Staff riders are created active (no KYC).
  const isPlatformAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superuser");
  if (isPlatformAdmin) {
    // An admin who is not a rider here sees every "my" list empty (the API answers "rider not
    // found in fleet"), which read as missing jobs. Say so instead.
    const notRider = !membership.isLoading && (membership.data?.status ?? "none") === "none";
    return (
      <>
        {notRider && (
          <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            You are signed in as an admin, not as a rider of this business, so your jobs and earnings are empty.
            Sign in with the rider&apos;s account to see theirs.
          </div>
        )}
        {children}
      </>
    );
  }

  if (membership.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const status = membership.data?.status ?? "none";
  const blocked = (modal: "none" | "pending" | "rejected") => (
    <div className="relative min-h-screen">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <AccessModal status={modal} />
    </div>
  );

  if (status === "active" || status === "approved" || status === "onboarding") return <>{children}</>;
  if (status === "pending_review") {
    return (
      <>
        <PendingReviewBanner />
        {children}
      </>
    );
  }
  if (status === "rejected" || status === "suspended") return blocked("rejected");
  if (status === "pending") return blocked("pending");
  return blocked("none");
}

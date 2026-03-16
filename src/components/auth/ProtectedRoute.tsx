"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AccessModal } from "./AccessModal";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { user, redirectToSSO } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to SSO login, storing current path as return URL
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      void redirectToSSO(path);
    }
  }, [isLoading, isAuthenticated, redirectToSSO]);

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

  // Gating Logic
  const hasRiderRole = user?.roles?.includes("rider");
  const isApproved = user?.status === "active" || user?.status === "approved" || user?.status === "onboarding";
  const isPlatformAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superuser");

  // Platform admins get a pass
  if (isPlatformAdmin) return <>{children}</>;

  // Non-riders or unapproved riders see the modal
  if (!hasRiderRole) {
    return (
      <div className="relative min-h-screen">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <AccessModal status="none" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="relative min-h-screen">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <AccessModal status="pending" />
      </div>
    );
  }

  return <>{children}</>;
}

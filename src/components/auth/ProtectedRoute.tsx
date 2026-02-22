"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, type ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to SSO login, storing current path as return URL
      void redirectToSSO(window.location.pathname);
    }
  }, [isLoading, isAuthenticated, redirectToSSO]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

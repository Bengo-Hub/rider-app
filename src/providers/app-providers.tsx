"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { setOn401 } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,     // 5 min — most data is reference/moderate
            gcTime: 10 * 60 * 1000,        // 10 min garbage collection
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const logout = useAuthStore((s) => s.logout);

  // Register 401 handler: clear all caches and redirect to SSO.
  // Skip during syncing/loading to avoid clearing session during JIT sync.
  // Also skip within 15s of authentication (tokens may still be propagating).
  // Note: the primary defense is token refresh in api.ts — this callback
  // only fires after refresh has already failed.
  useEffect(() => {
    setOn401(() => {
      const { status, lastAuthenticatedAt } = useAuthStore.getState();
      if (status === "syncing" || status === "loading") return;
      if (lastAuthenticatedAt && Date.now() - lastAuthenticatedAt < 15_000) return;
      queryClient.clear();
      logout();
    });
    return () => setOn401(null);
  }, [queryClient, logout]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
      <PWAInstallPrompt />
    </QueryClientProvider>
  );
}

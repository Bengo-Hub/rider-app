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

  // Register 401 handler: clear all caches and redirect to SSO
  useEffect(() => {
    setOn401(() => {
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

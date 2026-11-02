"use client";

import { useAuthStore, useAuthHydrated } from "@/store/auth-store";
import type { User } from "@/store/auth-store";
import { fetchMe } from "@/lib/auth-api";
import { refreshAccessToken } from "@/lib/token-refresh";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { user, accessToken, setUser, clearSession } = useAuthStore();
  const hydrated = useAuthHydrated();

  // Re-check the stored session with SSO in the background. Only a token SSO refuses and that
  // cannot be renewed ends the session, and only locally (the guard then goes through SSO, which
  // signs a rider with a live SSO session straight back in). A network or server error keeps the
  // rider signed in on what we already know.
  const { isLoading, error } = useQuery({
    queryKey: ["auth-me", accessToken],
    queryFn: async (): Promise<User> => {
      if (!accessToken) {
        throw new Error("No access token");
      }
      const load = async (token: string) => {
        const data = await fetchMe(token);
        const u: User = data.user ?? data;
        setUser(u);
        return u;
      };
      try {
        return await load(accessToken);
      } catch (err) {
        if ((err as { status?: number })?.status !== 401) throw err;
        const renewed = await refreshAccessToken();
        if (renewed) return load(renewed);
        clearSession();
        throw err;
      }
    },
    enabled: hydrated && !!accessToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const hasRole = (role: string, tenantSlug?: string) => {
    if (!user) return false;
    if (user.roles.includes("admin") || user.roles.includes("super_admin"))
      return true;
    if (tenantSlug) {
      const tenant = user.tenants.find((t) => t.slug === tenantSlug);
      return tenant?.roles.includes(role) ?? false;
    }
    return user.roles.includes(role);
  };

  const isRider = (tenantSlug?: string) => hasRole("rider", tenantSlug);

  return {
    user,
    // Nothing is decided before the saved session is read back; after that only a first check
    // with no known rider blocks the screen.
    isLoading: !hydrated || (isLoading && !!accessToken && !user),
    hasRole,
    isRider,
    isAuthenticated: !!user && !!accessToken,
    error,
  };
}

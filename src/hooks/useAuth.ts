"use client";

import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/store/auth-store";
import { fetchMe } from "@/lib/auth-api";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { user, accessToken, setUser, logout } = useAuthStore();

  // Validate the stored token by fetching the rider profile
  const { isLoading, error } = useQuery({
    queryKey: ["auth-me", accessToken],
    queryFn: async (): Promise<User> => {
      if (!accessToken) {
        throw new Error("No access token");
      }
      try {
        const data = await fetchMe(accessToken);
        const u: User = data.user ?? data;
        setUser(u);
        return u;
      } catch {
        logout();
        throw new Error("Not authenticated");
      }
    },
    enabled: !!accessToken,
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
    isLoading: isLoading && !!accessToken,
    hasRole,
    isRider,
    isAuthenticated: !!user && !!accessToken,
    error,
  };
}

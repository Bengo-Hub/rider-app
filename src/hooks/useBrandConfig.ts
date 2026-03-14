"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { brand as staticBrand } from "@/config/brand";
import { useOrgSlug } from "@/providers/org-slug-provider";

interface TenantBrandConfig {
  name: string;
  short_name?: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  support_phone?: string;
  brand_palette?: Record<string, string>;
  features?: Record<string, boolean>;
}

export const brandKeys = {
  all: ["brand"] as const,
  config: (tenantSlug: string) => [...brandKeys.all, "config", tenantSlug] as const,
};

export function useBrandConfig() {
  const orgSlug = useOrgSlug();
  const slug = orgSlug || "";

  return useQuery({
    queryKey: brandKeys.config(slug),
    queryFn: async () => {
      if (!slug) {
        return {
          name: staticBrand.name,
          shortName: staticBrand.shortName,
          logoUrl: staticBrand.assets.logo,
          supportEmail: staticBrand.support.email,
          supportPhone: staticBrand.support.phone,
          primaryColor: staticBrand.palette.primary,
        };
      }
      try {
        const data = await api.get<TenantBrandConfig>(`branding/${slug}`); 
        return {
          name: data.name || staticBrand.name,
          shortName: data.short_name || data.name || staticBrand.shortName,
          logoUrl: data.logo_url || staticBrand.assets.logo,
          supportEmail: data.support_email || staticBrand.support.email,
          supportPhone: data.support_phone || staticBrand.support.phone,
          primaryColor: data.primary_color || data.brand_palette?.primary || staticBrand.palette.primary,
        };
      } catch {
        return {
          name: staticBrand.name,
          shortName: staticBrand.shortName,
          logoUrl: staticBrand.assets.logo,
          supportEmail: staticBrand.support.email,
          supportPhone: staticBrand.support.phone,
          primaryColor: staticBrand.palette.primary,
        };
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}

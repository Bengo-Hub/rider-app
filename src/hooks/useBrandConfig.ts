"use client";

import { useQuery } from "@tanstack/react-query";
import {
  serviceAppName,
  serviceBrandingEntry,
  serviceShortName,
  type ServiceBrandingEntry,
} from "@bengo-hub/shared-ui-lib/branding";
import { brand as staticBrand } from "@/config/brand";
import { useOrgSlug } from "@/providers/org-slug-provider";

// Tenant branding comes from auth-api's public tenant record (the same source
// as the PWA manifest). logistics-api has no branding endpoint; the previous
// `branding/{slug}` call always failed and every tenant saw the static brand.
const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://sso.codevertexafrica.com";

interface PublicTenant {
  name?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  brand_colors?: { primary?: string };
  metadata?: Record<string, unknown>;
}

export interface RiderBrandConfig {
  /** Business name. */
  name: string;
  /** App name: the tenant's own name for the rider app, else "<brand word> Rider" (shared rule). */
  appName: string;
  shortName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  primaryColor: string;
}

export const brandKeys = {
  all: ["brand"] as const,
  config: (tenantSlug: string) => [...brandKeys.all, "config", tenantSlug] as const,
};

function staticConfig(): RiderBrandConfig {
  return {
    name: staticBrand.name,
    appName: staticBrand.shortName,
    shortName: staticBrand.shortName,
    logoUrl: staticBrand.assets.logo,
    supportEmail: staticBrand.support.email,
    supportPhone: staticBrand.support.phone,
    primaryColor: staticBrand.palette.primary,
  };
}

export function useBrandConfig() {
  const orgSlug = useOrgSlug();
  const slug = orgSlug || "";

  return useQuery({
    queryKey: brandKeys.config(slug),
    queryFn: async (): Promise<RiderBrandConfig> => {
      if (!slug) return staticConfig();
      try {
        const res = await fetch(`${AUTH_API_BASE}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`, {
          credentials: "omit",
        });
        if (!res.ok) return staticConfig();
        const tenant = (await res.json()) as PublicTenant;
        const entry: ServiceBrandingEntry = serviceBrandingEntry(tenant.metadata, "rider") ?? {};
        const name = tenant.name || slug;
        // Shared naming rule (shared-ui-lib branding): the tenant's own rider-app name wins, else
        // "<brand word> Rider" ("The Urban Rider").
        return {
          name,
          appName: serviceAppName(name, "Rider", slug, entry),
          shortName: serviceShortName(name, "Rider", slug, entry),
          logoUrl: entry.icon_url || tenant.logo_url || staticBrand.assets.logo,
          supportEmail: tenant.contact_email || staticBrand.support.email,
          supportPhone: tenant.contact_phone || staticBrand.support.phone,
          primaryColor: entry.theme_color || tenant.brand_colors?.primary || staticBrand.palette.primary,
        };
      } catch {
        return staticConfig();
      }
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

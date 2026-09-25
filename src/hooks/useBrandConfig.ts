"use client";

import { useQuery } from "@tanstack/react-query";
import { brand as staticBrand } from "@/config/brand";
import { useOrgSlug } from "@/providers/org-slug-provider";

// Tenant branding comes from auth-api's public tenant record (the same source
// as the PWA manifest). logistics-api has no branding endpoint; the previous
// `branding/{slug}` call always failed and every tenant saw the static brand.
const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  "https://sso.codevertexafrica.com";

interface ServiceBrandingEntry {
  name?: string;
  short_name?: string;
  icon_url?: string;
  theme_color?: string;
}

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
  /** App name: the tenant's own name for the rider app, else "<First word> Rider". */
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

function riderEntry(metadata: Record<string, unknown> | undefined): ServiceBrandingEntry {
  const all = metadata?.service_branding;
  if (!all || typeof all !== "object") return {};
  const entry = (all as Record<string, unknown>).rider;
  return entry && typeof entry === "object" ? (entry as ServiceBrandingEntry) : {};
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
        const entry = riderEntry(tenant.metadata);
        const name = tenant.name || slug;
        const firstWord = name.trim().split(/\s+/)[0] || name;
        const appName = entry.name || `${firstWord} Rider`;
        return {
          name,
          appName,
          shortName: entry.short_name || (appName.length <= 12 ? appName : `${firstWord} Rider`),
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

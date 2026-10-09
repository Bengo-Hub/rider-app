import { type NextRequest, NextResponse } from 'next/server';
import {
  serviceBrandingEntry,
  serviceFullName,
  serviceShortName,
  type ServiceBrandingEntry,
} from '@bengo-hub/shared-ui-lib/branding';

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  'https://sso.codevertexafrica.com';

const DEFAULT_PRIMARY = '#5B1C4D';
const DEFAULT_BG = '#1a0a15';
// This app's entry in tenant metadata service_branding (set in Accounts > Branding).
const SERVICE_KEY = 'rider';

interface TenantResponse {
  name?: string;
  logo_url?: string;
  brand_colors?: { primary?: string; secondary?: string };
  metadata?: Record<string, unknown>;
}

async function fetchTenant(slug: string): Promise<TenantResponse | null> {
  try {
    const res = await fetch(
      `${AUTH_API_BASE}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return null;
    return res.json() as Promise<TenantResponse>;
  } catch {
    return null;
  }
}

function metaString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = metadata?.[key];
  return typeof v === 'string' && v ? v : undefined;
}

/** Declared type of an icon URL; a wrong type makes browsers skip the icon. */
function iconMime(url: string): string | undefined {
  const data = /^data:(image\/[a-z0-9.+-]+)/i.exec(url);
  if (data) return data[1];
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return undefined;
}

// Bundled square PNGs are always listed so the app stays installable when the
// tenant icon is a wide logo; the tenant icon comes first so browsers prefer it.
const BUNDLED_ICONS = [
  { src: '/icons/rider-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/rider-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icons/rider-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const tenant = await fetchTenant(orgSlug);
  const entry: ServiceBrandingEntry = serviceBrandingEntry(tenant?.metadata, SERVICE_KEY) ?? {};

  const businessName = tenant?.name ?? orgSlug;
  // Shared naming rule (shared-ui-lib branding): the tenant's own app name (e.g. "Loft Riders")
  // wins, else "<Business> Rider" with a "<brand word> Rider" home-screen label.
  const name = serviceFullName(businessName, 'Rider', 'Bengo', entry);
  const shortName = serviceShortName(businessName, 'Rider', 'Bengo', entry);
  const primaryColor =
    entry.theme_color ?? tenant?.brand_colors?.primary ?? metaString(tenant?.metadata, 'primary_color') ?? DEFAULT_PRIMARY;
  const bgColor =
    tenant?.brand_colors?.secondary ?? metaString(tenant?.metadata, 'secondary_color') ?? DEFAULT_BG;
  const iconUrl = entry.icon_url || tenant?.logo_url || metaString(tenant?.metadata, 'logo_url');
  const iconType = iconUrl ? iconMime(iconUrl) : undefined;

  const icons = [
    ...(iconUrl
      ? [{ src: iconUrl, sizes: iconType === 'image/svg+xml' ? 'any' : '512x512', ...(iconType ? { type: iconType } : {}), purpose: 'any' }]
      : []),
    ...BUNDLED_ICONS,
  ];

  const manifest = {
    id: `/${orgSlug}/`,
    name,
    short_name: shortName,
    description: entry.tagline || 'Delivery rider app: accept jobs, navigate routes and track earnings.',
    start_url: `/${orgSlug}/`,
    scope: `/${orgSlug}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: bgColor,
    theme_color: primaryColor,
    categories: ['business', 'productivity', 'navigation'],
    lang: 'en',
    icons,
    shortcuts: [
      {
        name: 'Active Deliveries',
        short_name: 'Deliveries',
        description: 'View your active delivery jobs',
        url: `/${orgSlug}/deliveries`,
        icons: [{ src: '/icons/rider-icon-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
    },
  });
}

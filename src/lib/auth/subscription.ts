/**
 * Check whether a tenant has an active subscription.
 * Fails open (returns true) on network errors to avoid blocking users
 * when the subscriptions service is temporarily unavailable.
 */
export async function checkSubscription(
  tenantId: string,
  tenantSlug: string,
  accessToken: string,
): Promise<boolean> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL ||
    'https://pricingapi.codevertexitsolutions.com';
  try {
    const resp = await fetch(`${baseUrl}/api/v1/subscription`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Tenant-Slug': tenantSlug,
        'Content-Type': 'application/json',
      },
    });
    if (resp.status === 404) return false;
    if (!resp.ok) return true; // fail open
    const sub: { status?: string } = await resp.json();
    const s = (sub.status ?? '').toUpperCase();
    return s === 'ACTIVE' || s === 'TRIAL';
  } catch {
    return true; // fail open on network error
  }
}

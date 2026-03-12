/**
 * Auth API for rider-app.
 * Authentication is handled via SSO (auth-service) OIDC flow.
 * This module provides SSO URL builders and token exchange.
 */

// SSO configuration
const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_URL ?? "https://sso.codevertexitsolutions.com";
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? "rider-app";

/** SSO auth/me URL — profile must be fetched from auth-api (SSO), not from logistics-api. */
export const SSO_ME_URL = `${SSO_BASE_URL}/api/v1/auth/me`;

/**
 * Build the SSO authorize URL for OIDC Authorization Code + PKCE flow.
 */
export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
  tenant?: string;
}): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope ?? "openid profile email offline_access");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.tenant) {
    url.searchParams.set("tenant", params.tenant);
  }
  return url.toString();
}

/**
 * Build the SSO signup URL for rider registration.
 */
export function buildSignupUrl(returnTo: string): string {
  const url = new URL("/signup", SSO_BASE_URL.replace("/api/v1", ""));
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}

/**
 * Build the SSO logout URL for single sign-out.
 */
export function buildLogoutUrl(postLogoutRedirectUri?: string): string {
  const url = new URL("/api/v1/auth/logout", SSO_BASE_URL);
  if (postLogoutRedirectUri) {
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }
  return url.toString();
}

/**
 * Exchange an authorization code for tokens via the SSO token endpoint.
 * This is the PKCE code exchange step.
 */
export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: SSO_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(`${SSO_BASE_URL}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || errorData.error || "Token exchange failed");
  }

  return response.json();
}

/**
 * Fetch current user profile (roles, permissions, tenant) from SSO auth-api.
 * Must call SSO, not logistics-api — logistics-api may not expose /riders/me or may 404.
 * Returns a shape compatible with rider-app User (id, email, fullName, roles, tenants).
 */
export async function fetchMe(accessToken: string) {
  const response = await fetch(SSO_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(
      body?.error_description ?? body?.error ?? `Profile failed: ${response.status}`
    );
    (err as any).status = response.status;
    throw err;
  }

  const data = await response.json();
  const roles = Array.isArray(data.roles) ? data.roles : [];
  const tenantId = data.tenant_id ?? "";
  const tenantSlug = data.tenant_slug ?? "";

  const user = {
    id: data.id ?? data.sub ?? "",
    email: data.email ?? "",
    name: data.full_name ?? data.name ?? "",
    fullName: data.full_name ?? data.name ?? "",
    roles,
    tenants: tenantId || tenantSlug
      ? [{ id: tenantId, name: "", slug: tenantSlug, roles }]
      : [],
  };

  return { user, ...data };
}

/**
 * Logout - redirect to SSO logout for single sign-out.
 */
export function logoutRedirect(): void {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const logoutUrl = buildLogoutUrl(`${currentOrigin}/login`);
  window.location.href = logoutUrl;
}

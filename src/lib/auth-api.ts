/**
 * Auth API for rider-app.
 * Authentication is handled via SSO (auth-service) OIDC flow.
 * This module provides SSO URL builders and token exchange.
 */

// SSO configuration
const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_URL ?? "https://sso.codevertexitsolutions.com";
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? "";

// Logistics API for rider profile sync checks
const LOGISTICS_API_URL =
  process.env.NEXT_PUBLIC_LOGISTICS_API_URL ?? "http://localhost:4020/api/v1";

/**
 * Build the SSO authorize URL for OIDC Authorization Code + PKCE flow.
 */
export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
}): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope ?? "openid profile email offline_access");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
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
 * Fetch the current rider's profile from the logistics-api.
 * This confirms the user has been synced from SSO via NATS events.
 */
export async function fetchMe(accessToken: string) {
  const tenantSlug =
    typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
  };

  const response = await fetch(`${LOGISTICS_API_URL}/riders/me`, {
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const err = new Error(body?.message ?? `API error ${response.status}`);
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Logout - redirect to SSO logout for single sign-out.
 */
export function logoutRedirect(): void {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const logoutUrl = buildLogoutUrl(`${currentOrigin}/login`);
  window.location.href = logoutUrl;
}

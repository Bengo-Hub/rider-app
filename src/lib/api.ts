export const API_BASE =
  process.env.NEXT_PUBLIC_LOGISTICS_API_URL ?? "http://localhost:4020/api/v1";

let on401Callback: (() => void) | null = null;

/** Register a callback to run when any API response is 401 (e.g. clear session / redirect to auth). */
export function setOn401(callback: (() => void) | null) {
  on401Callback = callback;
}

/**
 * The tenant the access token was issued for (tenant_id / tenant_slug claims). The API pins a
 * rider to this tenant, so it beats whatever an earlier session left in localStorage. Only
 * reads the payload; the API verifies the signature.
 */
export function tokenTenant(token: string | null | undefined): { id: string | null; slug: string | null } {
  const none = { id: null, slug: null };
  const part = token?.split(".")[1];
  if (!part) return none;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return {
      id: typeof claims?.tenant_id === "string" && claims.tenant_id ? claims.tenant_id : null,
      slug: typeof claims?.tenant_slug === "string" && claims.tenant_slug ? claims.tenant_slug : null,
    };
  } catch {
    return none;
  }
}

/** True when the API refused the request because the tenant sent is not the signed-in one. */
async function isTenantMismatch(res: Response): Promise<boolean> {
  if (res.status !== 403) return false;
  const text = await res.clone().text().catch(() => "");
  return /tenant does not match/i.test(text);
}

async function request<T>(
  path: string,
  options?: RequestInit,
  tenantRetried = false,
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("rider-auth-storage") ?? "{}")?.state
          ?.accessToken
      : null;

  const claimed = tokenTenant(token);
  const tenantSlug =
    claimed.slug ?? (typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null);
  const tenantId =
    claimed.id ?? (typeof window !== "undefined" ? localStorage.getItem("tenantId") : null);

  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  // Extract org slug from URL if not in localStorage
  let effectiveSlug = tenantSlug;
  if (!effectiveSlug && typeof window !== "undefined") {
    const parts = window.location.pathname.split("/");
    if (parts.length > 2 && parts[1] !== "api") {
      effectiveSlug = parts[1];
    }
  }

  const finalPath = effectiveSlug && !path.startsWith(`/${effectiveSlug}`) 
    ? `/${effectiveSlug}${path}` 
    : path;

  const res = await fetch(`${API_BASE}${finalPath}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) {
      // If token is already cleared (explicit logout in progress), skip entirely
      if (!token) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `API error ${res.status}`);
      }
      // Skip auto-logout for /auth/me — may 401 before JIT sync completes
      if (!path.includes("/auth/me")) {
        const { refreshAccessToken } = await import("@/lib/token-refresh");
        const newToken = await refreshAccessToken(token);

        if (newToken) {
          // Retry with refreshed token
          headers.Authorization = `Bearer ${newToken}`;
          const retryRes = await fetch(`${API_BASE}${finalPath}`, {
            ...options,
            headers,
            credentials: "include",
          });
          if (retryRes.ok) return retryRes.json();
          if (retryRes.status === 401 && on401Callback) on401Callback();
          throw new Error(await errorMessage(retryRes));
        }

        // Refresh failed — fire logout callback
        if (on401Callback) on401Callback();
      }
    }
    // A tenant left over from another session: forget it and try once more with the token's own.
    if (!tenantRetried && typeof window !== "undefined" && (await isTenantMismatch(res))) {
      localStorage.removeItem("tenantSlug");
      localStorage.removeItem("tenantId");
      return request<T>(path, options, true);
    }
    throw new Error(await errorMessage(res));
  }

  return res.json();
}

/**
 * errorMessage reads a failed response's reason. logistics-api answers most rejections as plain
 * text (http.Error), so a JSON-only parse left riders with a bare "API error 400" instead of
 * "enter the 10-character M-Pesa code" or "this delivery is assigned to another rider".
 */
async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      const body = JSON.parse(text);
      const msg = body?.message ?? body?.error;
      if (typeof msg === "string" && msg) return msg;
    } catch {
      // not JSON: use the text itself
    }
    const plain = text.trim().replace(/^tasks:\s*/i, "");
    if (plain && plain.length < 300) return plain.charAt(0).toUpperCase() + plain.slice(1);
  }
  return `Request failed (${res.status})`;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: "POST",
      body: formData,
      headers: {}, // Let fetch set Content-Type with boundary
    }),
};

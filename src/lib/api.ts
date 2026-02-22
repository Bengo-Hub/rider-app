const API_BASE =
  process.env.NEXT_PUBLIC_LOGISTICS_API_URL ?? "http://localhost:4020/api/v1";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const tenantSlug =
    typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null;
  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;

  const token =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("rider-auth-storage") ?? "{}")?.state
          ?.accessToken
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
    ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `API error ${res.status}`);
  }

  return res.json();
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
};

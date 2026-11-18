import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { api, tokenTenant } from "@/lib/api";

function jwt(claims: Record<string, unknown>): string {
  const b64 = btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `x.${b64}.sig`;
}

describe("tokenTenant", () => {
  it("reads the tenant claims", () => {
    expect(tokenTenant(jwt({ tenant_id: "t-1", tenant_slug: "urban-loft" }))).toEqual({ id: "t-1", slug: "urban-loft" });
  });
  it("returns nothing for a missing or broken token", () => {
    expect(tokenTenant(null)).toEqual({ id: null, slug: null });
    expect(tokenTenant("not-a-jwt")).toEqual({ id: null, slug: null });
  });
});

describe("api tenant headers", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "rider-auth-storage",
      JSON.stringify({ state: { accessToken: jwt({ tenant_id: "t-1", tenant_slug: "urban-loft" }) } }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends the token's tenant, not a stale stored one", async () => {
    localStorage.setItem("tenantSlug", "old-tenant");
    localStorage.setItem("tenantId", "t-old");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/riders/me");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/urban-loft/riders/me");
    expect(init.headers["X-Tenant-Slug"]).toBe("urban-loft");
    expect(init.headers["X-Tenant-ID"]).toBe("t-1");
  });

  it("clears the stored tenant and retries once on a tenant mismatch", async () => {
    localStorage.setItem("tenantSlug", "old-tenant");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"error":"tenant does not match the signed-in organization"}', { status: 403 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.get("/riders/me");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("tenantSlug")).toBeNull();
  });
});

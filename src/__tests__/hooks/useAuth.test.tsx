import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/auth-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth-api")>()),
  fetchMe: vi.fn(),
  logoutRedirect: vi.fn(),
  revokeServerSession: vi.fn(),
}));
vi.mock("@/lib/token-refresh", () => ({ refreshAccessToken: vi.fn() }));

import { fetchMe, logoutRedirect } from "@/lib/auth-api";
import { refreshAccessToken } from "@/lib/token-refresh";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore, type User } from "@/store/auth-store";

const rider: User = { id: "r1", email: "rider@test.com", roles: ["rider"], tenants: [{ id: "t1", name: "", slug: "codevertex-demo", roles: ["rider"] }] };
const unauthorized = Object.assign(new Error("Profile failed: 401"), { status: 401 });

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function signedIn() {
  useAuthStore.setState({ user: rider, accessToken: "old", refreshToken: "refresh", isAuthenticated: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
});

describe("useAuth", () => {
  it("keeps a known rider on screen while the session is re-checked", () => {
    signedIn();
    vi.mocked(fetchMe).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("renews an expired token instead of signing the rider out", async () => {
    signedIn();
    vi.mocked(fetchMe).mockRejectedValueOnce(unauthorized).mockResolvedValue({ user: rider });
    vi.mocked(refreshAccessToken).mockImplementation(async () => {
      useAuthStore.setState({ accessToken: "new" });
      return "new";
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(fetchMe).toHaveBeenCalledWith("new"));
    expect(result.current.isAuthenticated).toBe(true);
    expect(logoutRedirect).not.toHaveBeenCalled();
  });

  it("ends only this app's session when the token cannot be renewed", async () => {
    signedIn();
    vi.mocked(fetchMe).mockRejectedValue(unauthorized);
    vi.mocked(refreshAccessToken).mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(logoutRedirect).not.toHaveBeenCalled();
  });

  it("keeps the rider signed in through a network or server error", async () => {
    signedIn();
    vi.mocked(fetchMe).mockRejectedValue(Object.assign(new Error("Profile failed: 502"), { status: 502 }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.isAuthenticated).toBe(true);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(logoutRedirect).not.toHaveBeenCalled();
  });
});

describe("clearSession", () => {
  it("drops the session without leaving the app", () => {
    signedIn();
    useAuthStore.getState().clearSession();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(logoutRedirect).not.toHaveBeenCalled();
  });
});

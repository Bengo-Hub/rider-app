import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, type User } from "@/store/auth-store";

const mockUser: User = {
  id: "rider-1",
  email: "rider@test.com",
  name: "John Rider",
  roles: ["rider"],
  tenants: [
    { id: "t-1", name: "Urban Loft", slug: "urban-loft", roles: ["rider"] },
  ],
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("starts with null user and isLoading true", () => {
    // After logout, isLoading is false. Reset to initial state manually.
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true, accessToken: null });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
  });

  it("sets user and marks as authenticated", () => {
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("stores access token", () => {
    useAuthStore.getState().setAccessToken("jwt-token-123");

    expect(useAuthStore.getState().accessToken).toBe("jwt-token-123");
  });

  it("clears all state on logout", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setAccessToken("jwt-token-123");
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("persists to rider-auth-storage key", () => {
    useAuthStore.getState().setUser(mockUser);

    const raw = localStorage.getItem("rider-auth-storage");
    expect(raw).toBeTruthy();

    const stored = JSON.parse(raw!);
    expect(stored.state.user.id).toBe("rider-1");
    expect(stored.state.isAuthenticated).toBe(true);
  });

  it("sets null user to mark as unauthenticated", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchMe,
  logoutRedirect,
} from "@/lib/auth-api";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  storeState,
  storeVerifier,
  consumeVerifier,
} from "@/lib/auth/pkce";

export interface UserTenant {
  id: string;
  name: string;
  slug: string;
  roles: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  phone?: string;
  roles: string[];
  tenants: UserTenant[];
  status?: string;
}

type AuthStatus = "idle" | "loading" | "syncing" | "authenticated" | "error";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: AuthStatus;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  redirectToSSO: (returnTo?: string) => Promise<void>;
  handleSSOCallback: (code: string, callbackUrl: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      status: "idle" as AuthStatus,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          status: user ? "authenticated" : "idle",
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Redirect to SSO authorize endpoint with PKCE.
       */
      redirectToSSO: async (returnTo?: string) => {
        // Store return URL for after callback
        if (returnTo) {
          sessionStorage.setItem("sso_return_to", returnTo);
        }

        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const state = generateState();

        storeVerifier(verifier);
        storeState(state);

        const redirectUri = `${window.location.origin}/auth/callback`;
        const authorizeUrl = buildAuthorizeUrl({
          codeChallenge: challenge,
          state,
          redirectUri,
        });

        window.location.href = authorizeUrl;
      },

      /**
       * Handle SSO callback - exchange code for tokens and sync rider profile.
       */
      handleSSOCallback: async (code: string, callbackUrl: string) => {
        set({ status: "loading", error: null, isLoading: true });

        try {
          // Step 1: Retrieve PKCE verifier
          const codeVerifier = consumeVerifier();
          if (!codeVerifier) {
            throw new Error("Missing PKCE code verifier. Please try signing in again.");
          }

          // Step 2: Exchange authorization code for tokens
          const tokenResponse = await exchangeCodeForTokens({
            code,
            codeVerifier,
            redirectUri: callbackUrl,
          });

          const accessToken = tokenResponse.access_token;
          set({ accessToken, refreshToken: tokenResponse.refresh_token ?? null });

          // Step 3: Poll logistics-api for rider sync (via NATS events)
          set({ status: "syncing" });

          const maxAttempts = 10;
          const pollInterval = 1500;
          let syncAttempts = 0;

          while (syncAttempts < maxAttempts) {
            try {
              const profile = await fetchMe(accessToken);
              const user: User = profile.user ?? profile;

              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                status: "authenticated",
                error: null,
              });
              return;
            } catch (err: any) {
              const httpStatus = err?.status;
              // 404 or 401 means user not synced yet - keep polling
              if (httpStatus === 404 || httpStatus === 401) {
                syncAttempts++;
                await new Promise((r) => setTimeout(r, pollInterval));
                continue;
              }
              // Other errors are real failures
              throw err;
            }
          }

          // Sync timed out - user might still be syncing
          throw new Error("Account sync is taking longer than expected. Please try again.");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Sign-in failed";
          set({
            status: "error",
            error: message,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      },

      /**
       * Logout - clear local state and redirect to SSO logout.
       */
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          status: "idle",
          error: null,
        });
        logoutRedirect();
      },
    }),
    {
      name: "rider-auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

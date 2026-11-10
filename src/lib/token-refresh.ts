/**
 * Access-token refresh for rider-app, built on the shared cross-tab-safe refresher
 * (@bengo-hub/shared-ui-lib/auth createSessionRefresher). Before spending the refresh token it
 * picks up a newer session another tab saved, tabs take turns refreshing, and an enrolment-only
 * answer counts as signed out. See the shared module for the full story.
 *
 * The rider store keeps the tokens as flat fields, so they are mapped to and from the session
 * shape the shared refresher reads.
 */

import { createSessionRefresher } from '@bengo-hub/shared-ui-lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { refreshTokens } from '@/lib/auth-api';

/** The persisted store key; also names the cross-tab refresh lock and the storage watcher. */
export const AUTH_STORAGE_KEY = 'rider-auth-storage';

const refreshSession = createSessionRefresher({
  lockName: AUTH_STORAGE_KEY,
  getSession: () => {
    const { accessToken, refreshToken, expiresAt } = useAuthStore.getState();
    if (!accessToken && !refreshToken) return null;
    // A session saved before expiresAt was kept reads as expired, so it is never adopted.
    return { accessToken: accessToken ?? '', refreshToken: refreshToken ?? '', expiresAt: expiresAt ?? 0 };
  },
  reloadSession: () => useAuthStore.persist.rehydrate(),
  saveSession: ({ accessToken, refreshToken, expiresAt }) =>
    useAuthStore.setState({
      accessToken,
      refreshToken,
      expiresAt: typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime(),
    }),
  refresh: refreshTokens,
});

/**
 * Returns a usable access token, or null when the session is over (or auth-api could not be
 * reached; callers here already treat both the same way). Pass the token the server just
 * rejected when it is known.
 */
export async function refreshAccessToken(failedToken?: string | null): Promise<string | null> {
  const outcome = await refreshSession(failedToken);
  return 'token' in outcome ? outcome.token : null;
}

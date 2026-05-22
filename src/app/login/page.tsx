"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useBiometric } from "@/hooks/use-biometric";
import { Fingerprint, Loader2, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("return_to") ?? "/";
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const hydrateFromWebAuthn = useAuthStore((s) => s.hydrateFromWebAuthn);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStoredEmail(localStorage.getItem('sso_last_email'));
    }
  }, []);

  const { authenticate, isSupported, hasRegisteredCredential, isLoading: biometricLoading, error: biometricError } = useBiometric({
    onAuthSuccess: async (tokens) => {
      await hydrateFromWebAuthn(tokens);
      router.replace(returnTo);
    },
  });

  if (isAuthenticated) {
    router.replace(returnTo);
    return null;
  }

  const handleSignIn = async () => {
    await redirectToSSO(returnTo);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-bold text-white">
            R
          </div>
          <h1 className="mt-4 text-2xl font-bold">Rider App</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your deliveries
          </p>
        </div>

        <div className="space-y-3">
          {/* Biometric shortcut */}
          {isSupported && hasRegisteredCredential && storedEmail && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => authenticate(storedEmail)}
                disabled={biometricLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-base font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-60"
              >
                {biometricLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Fingerprint className="size-5" />
                )}
                {biometricLoading ? 'Verifying…' : 'Sign in with fingerprint'}
              </button>
              {biometricError && (
                <p className="text-center text-xs text-destructive">{biometricError}</p>
              )}
            </div>
          )}

          {/* SSO Sign In */}
          <button
            onClick={handleSignIn}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
          >
            <Shield className="size-5" />
            Sign in with BengoBox
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  );
}

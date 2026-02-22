"use client";

import { Suspense, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldAlert, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get("code");
  const oauthError = searchParams?.get("error");
  const handleSSOCallback = useAuthStore((s) => s.handleSSOCallback);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const hasStarted = useRef(false);

  // Step 1: Exchange code for tokens and sync rider
  useEffect(() => {
    if (oauthError || !code || hasStarted.current) return;
    hasStarted.current = true;

    const callbackUrl = `${window.location.origin}${window.location.pathname}`;
    void handleSSOCallback(code, callbackUrl);
  }, [code, oauthError, handleSSOCallback]);

  // Step 2: Once synced and authenticated, redirect to the right destination
  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    const timer = setTimeout(() => {
      // Get the return URL saved before SSO redirect
      const returnTo =
        typeof window !== "undefined"
          ? sessionStorage.getItem("sso_return_to") ?? "/"
          : "/";
      sessionStorage.removeItem("sso_return_to");

      // If user has pending status (awaiting approval), redirect to pending page
      if (user.status === "pending" || user.status === "pending_review") {
        router.replace("/auth/pending");
        return;
      }

      router.replace(returnTo);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, user, router]);

  // Error state from SSO redirect
  if (oauthError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-background">
        <ShieldAlert className="size-10 text-red-500" />
        <h1 className="text-2xl font-bold">Sign-in failed</h1>
        <p className="text-sm text-muted-foreground">
          {oauthError === "access_denied"
            ? "You denied the permissions requested. Please try again."
            : "We were unable to complete your sign-in."}
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Return to sign in
        </button>
      </div>
    );
  }

  // Auth store error
  if (status === "error" && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-background">
        <ShieldAlert className="size-10 text-red-500" />
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => {
            hasStarted.current = false;
            router.replace("/login");
          }}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </div>
    );
  }

  // Synced - show rider confirmation
  if (status === "authenticated" && user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-background">
        <CheckCircle2 className="size-12 text-green-500" />
        <h1 className="text-2xl font-bold">
          Welcome{user.name || user.fullName ? `, ${user.name || user.fullName}` : ""}!
        </h1>
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
          <User className="size-5 text-orange-500" />
          <div className="text-left">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs capitalize text-muted-foreground">
              {user.roles.join(", ")}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Redirecting you now...</p>
      </div>
    );
  }

  // Default: syncing/loading
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-background">
      <Loader2 className="size-10 text-orange-500 animate-spin" />
      <h1 className="text-2xl font-bold">
        {status === "syncing" ? "Syncing your account..." : "Completing sign-in..."}
      </h1>
      <p className="text-sm text-muted-foreground">
        Hold on while we sync your rider profile.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

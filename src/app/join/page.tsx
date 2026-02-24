"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

const BENEFITS = [
  {
    icon: Wallet,
    title: "Earn daily",
    desc: "Get paid per delivery — cash out anytime",
  },
  {
    icon: Clock,
    title: "Flexible hours",
    desc: "Work when you want, as much as you want",
  },
  {
    icon: MapPin,
    title: "Local deliveries",
    desc: "Short distance runs in your neighbourhood",
  },
  {
    icon: Star,
    title: "Bonus rewards",
    desc: "Top riders earn weekly performance bonuses",
  },
  {
    icon: ShieldCheck,
    title: "Insured rides",
    desc: "Rider insurance included from day one",
  },
];

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const inviteCode = searchParams?.get("invite_code") ?? searchParams?.get("token") ?? "";
  const orgSlug =
    searchParams?.get("org") ??
    searchParams?.get("tenant") ??
    process.env.NEXT_PUBLIC_TENANT_SLUG ??
    "urban-loft";

  const [starting, setStarting] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(`/${orgSlug}`);
    }
  }, [isAuthenticated, orgSlug, router]);

  const handleAccept = async () => {
    setStarting(true);

    // Persist invite context so callback can use it
    if (inviteCode) {
      sessionStorage.setItem("rider_invite_code", inviteCode);
    }
    sessionStorage.setItem("rider_invite_org", orgSlug);

    // After SSO, go to profile completion
    const returnTo = `/${orgSlug}/profile`;

    await redirectToSSO(returnTo, orgSlug);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="bg-orange-500 px-5 pt-10 pb-8 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Bike className="size-7" />
          <span className="text-xl font-bold tracking-tight">BengoBox Rider</span>
        </div>
        <h1 className="text-2xl font-extrabold leading-tight">
          You&apos;ve been invited to join as a rider
        </h1>
        <p className="mt-2 text-sm text-orange-100">
          Deliver orders for{" "}
          <span className="font-semibold text-white capitalize">
            {orgSlug.replace(/-/g, " ")}
          </span>{" "}
          and earn on your schedule.
        </p>
      </header>

      {/* Benefits */}
      <main className="flex-1 px-5 py-6 space-y-3">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          What you get
        </p>
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.title}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <Icon className="size-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500">{b.desc}</p>
              </div>
            </div>
          );
        })}

        {/* How it works */}
        <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-orange-800">How it works</p>
          {[
            "Sign up or log in with your email",
            "Your account is reviewed (usually under 24 h)",
            "Complete your rider profile once approved",
            "Start accepting deliveries immediately",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-orange-400" />
              <p className="text-xs text-orange-700">{step}</p>
            </div>
          ))}
        </div>
      </main>

      {/* CTA */}
      <footer className="sticky bottom-0 border-t bg-white px-5 py-4 space-y-2">
        <button
          onClick={handleAccept}
          disabled={starting}
          className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white shadow-sm active:bg-orange-600 disabled:opacity-60"
        >
          {starting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Redirecting to sign up...
            </>
          ) : (
            "Accept Invitation & Sign Up"
          )}
        </button>
        <p className="text-center text-xs text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => redirectToSSO(`/${orgSlug}`, orgSlug)}
            className="font-medium text-orange-500 underline"
          >
            Sign in
          </button>
        </p>
      </footer>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}

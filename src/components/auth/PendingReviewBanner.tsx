"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";

export function PendingReviewBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("kyc_banner_dismissed") === "true";
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("kyc_banner_dismissed", "true");
  };

  return (
    <div className="relative w-full bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 text-sm text-amber-800">
          <span className="font-medium">Application under review.</span>{" "}
          We&apos;ll notify you by email once your KYC documents have been reviewed and approved.
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

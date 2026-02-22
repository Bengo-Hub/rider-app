"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold">
          R
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install Rider App</p>
          <p className="text-xs text-gray-500">Quick access from home screen</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-medium text-white active:bg-orange-600"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 active:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

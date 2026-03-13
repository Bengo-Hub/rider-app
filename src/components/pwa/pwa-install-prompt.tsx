"use client";

import { Download, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rider-app-pwa-install-dismissed";
const RE_PROMPT_MS = 30 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  return !Number.isNaN(ts) && Date.now() - ts < RE_PROMPT_MS;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      promptRef.current = ev;
      setDeferredPrompt(ev);
      if (!wasDismissedRecently()) setTimeout(() => setShowBanner(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      promptRef.current = null;
      setShowBanner(false);
    });
    const interval = setInterval(() => {
      if (!isStandalone() && !wasDismissedRecently() && promptRef.current) setShowBanner(true);
    }, RE_PROMPT_MS);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (!deferredPrompt || !showBanner) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-50 mx-auto w-full max-w-sm px-4 animate-in slide-in-from-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold">
          R
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold sm:text-base">Install Rider App</p>
          <p className="text-xs text-gray-500 sm:text-sm">Quick access from home screen</p>
        </div>
        <button
          onClick={handleInstall}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-medium text-white active:bg-orange-600 touch-manipulation sm:min-h-[36px] sm:min-w-0"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden xs:inline sm:inline">Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-400 active:bg-gray-100 touch-manipulation sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

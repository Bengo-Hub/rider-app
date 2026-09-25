"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, CheckCircle2 } from "lucide-react";

import { useOrgSlug } from "@/providers/org-slug-provider";
import { orgRoute } from "@/lib/routes";
import { useNotificationPrefs, type NotificationPrefs } from "@/hooks/use-notification-prefs";
import { BottomNav } from "@/components/layout/bottom-nav";
import { isPushSupported, registerRiderPush } from "@/lib/push";

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function PrefRow({
  label,
  description,
  prefKey,
}: {
  label: string;
  description: string;
  prefKey: keyof NotificationPrefs;
}) {
  const { prefs, setPref } = useNotificationPrefs();
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Toggle checked={prefs[prefKey]} onChange={(v) => setPref(prefKey, v)} />
    </div>
  );
}

// ─── Push Permission Banner ───────────────────────────────────────────────────

// "Enabled" means this device is registered for push with notifications-api, not merely that the
// browser granted permission (the old banner stopped there, so no push could ever arrive).
function PushPermissionBanner() {
  const { pushGranted, setPushGranted } = useNotificationPrefs();
  const [checked, setChecked] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permState, setPermState] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isPushSupported().then((ok) => {
      if (cancelled) return;
      setChecked(true);
      if (!ok) return;
      setSupported(true);
      setPermState(Notification.permission);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) return null;
  if (!supported) {
    return (
      <div className="flex items-start gap-2 rounded-xl border px-4 py-3 mb-4 text-xs text-muted-foreground">
        <BellOff className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Push alerts are not available on this device or app yet. New jobs still appear under
          Deliveries &gt; Open jobs, which refreshes by itself.
        </span>
      </div>
    );
  }
  if (permState === "denied") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        Notifications are blocked for this app. Allow them in your browser or phone settings to get
        new job alerts.
      </div>
    );
  }
  if (pushGranted && permState === "granted") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 mb-4">
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          Push notifications are enabled
        </p>
      </div>
    );
  }

  const requestPermission = async () => {
    setBusy(true);
    setFailed(false);
    const result = await Notification.requestPermission();
    setPermState(result);
    const registered = result === "granted" && (await registerRiderPush());
    setPushGranted(registered);
    setFailed(result === "granted" && !registered);
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
          <BellOff className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            Enable push notifications
          </p>
          <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
            Get instant alerts for new deliveries and earnings even when the app is closed.
          </p>
          <button
            type="button"
            onClick={requestPermission}
            disabled={busy}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white active:bg-orange-600 disabled:opacity-60"
          >
            <Bell className="h-3.5 w-3.5" />
            {busy ? "Setting up..." : "Allow Notifications"}
          </button>
          {failed && (
            <p className="mt-2 text-xs text-red-600">Could not register this device. Check your connection and try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const orgSlug = useOrgSlug();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={orgRoute(orgSlug, "/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg active:bg-gray-100 dark:active:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">Notifications</h1>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4">
        <PushPermissionBanner />

        {/* Task Alerts */}
        <section>
          <p className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Task Alerts
          </p>
          <div className="rounded-xl border bg-white dark:bg-card divide-y divide-border">
            <PrefRow
              prefKey="taskAssigned"
              label="New task assigned"
              description="Alert when a new delivery is assigned to you"
            />
            <PrefRow
              prefKey="taskUpdates"
              label="Task status updates"
              description="Reminders for pickup, drop-off, and completion steps"
            />
            <PrefRow
              prefKey="taskCancelled"
              label="Task cancelled"
              description="Notify when a task you were assigned is cancelled"
            />
          </div>
        </section>

        {/* Earnings */}
        <section>
          <p className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Earnings
          </p>
          <div className="rounded-xl border bg-white dark:bg-card divide-y divide-border">
            <PrefRow
              prefKey="paymentReceived"
              label="Payment received"
              description="Notify when a payout or earnings credit is processed"
            />
            <PrefRow
              prefKey="weeklySummary"
              label="Weekly earnings summary"
              description="Monday recap of last week's deliveries and earnings"
            />
          </div>
        </section>

        {/* System */}
        <section>
          <p className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            System
          </p>
          <div className="rounded-xl border bg-white dark:bg-card divide-y divide-border">
            <PrefRow
              prefKey="appUpdates"
              label="App updates"
              description="Know when a new version of the app is available"
            />
            <PrefRow
              prefKey="promotions"
              label="Promotions &amp; announcements"
              description="Bonus opportunities, zone incentives, and news"
            />
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground px-4">
          Preferences are saved on this device. Critical security messages are always sent.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

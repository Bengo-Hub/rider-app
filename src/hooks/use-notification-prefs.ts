"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationPrefs {
  // Task alerts
  taskAssigned: boolean;
  taskUpdates: boolean;
  taskCancelled: boolean;
  // Earnings
  paymentReceived: boolean;
  weeklySummary: boolean;
  // System
  appUpdates: boolean;
  promotions: boolean;
}

interface NotificationPrefsState {
  prefs: NotificationPrefs;
  pushGranted: boolean;
  setPref: (key: keyof NotificationPrefs, value: boolean) => void;
  setPushGranted: (granted: boolean) => void;
}

const defaults: NotificationPrefs = {
  taskAssigned: true,
  taskUpdates: true,
  taskCancelled: true,
  paymentReceived: true,
  weeklySummary: true,
  appUpdates: false,
  promotions: false,
};

export const useNotificationPrefs = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      prefs: defaults,
      pushGranted: false,
      setPref: (key, value) =>
        set((s) => ({ prefs: { ...s.prefs, [key]: value } })),
      setPushGranted: (granted) => set({ pushGranted: granted }),
    }),
    { name: "rider-notification-prefs" },
  ),
);

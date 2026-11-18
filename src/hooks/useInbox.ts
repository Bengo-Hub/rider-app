"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE, api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

/** A message in the rider's inbox (logistics LogisticsNotification with a recipient). */
export interface InboxMessage {
  id: string;
  notification_type: "job_assigned" | "job_unassigned" | "job_cancelled" | "payout_sent" | string;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  related_task_id?: string | null;
  is_read: boolean;
  created_at: string;
}

interface InboxResponse {
  data: InboxMessage[];
  total: number;
  unread: number;
}

const key = (tenantSlug: string) => ["inbox", tenantSlug];

/** The rider's inbox, newest first (read ones included). */
export function useInbox(tenantSlug: string) {
  return useQuery({
    queryKey: key(tenantSlug),
    queryFn: () => api.get<InboxResponse>(`/${tenantSlug}/riders/me/notifications?include_read=true`),
    enabled: !!tenantSlug,
    // The stream keeps it fresh; this poll covers a socket that cannot connect.
    refetchInterval: 60_000,
  });
}

export function useMarkRead(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/${tenantSlug}/riders/me/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantSlug) }),
  });
}

export function useMarkAllRead(tenantSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/${tenantSlug}/riders/me/notifications/mark-all-read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantSlug) }),
  });
}

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;

/**
 * Live inbox: each new message the moment logistics creates it. A browser WebSocket cannot set
 * an Authorization header, so each connect first fetches a single-use stream ticket
 * (POST /{tenant}/stream-ticket) and opens the socket with ?ticket=. Reconnects with backoff and
 * a fresh ticket; the poll in useInbox covers a socket that never connects.
 */
export function useInboxStream(tenantSlug: string, onMessage?: (m: InboxMessage) => void) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  const closed = useRef(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(async () => {
    if (closed.current || !tenantSlug || typeof WebSocket === "undefined") return;
    if (!useAuthStore.getState().accessToken) return;

    const scheduleReconnect = () => {
      if (closed.current) return;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt.current, RECONNECT_MAX_MS);
      attempt.current += 1;
      timer.current = setTimeout(connect, delay);
    };

    // A fresh single-use ticket for every connect and reconnect (the Bearer token stays in the
    // request header, never in the socket URL).
    let ticket: string;
    try {
      ({ ticket } = await api.post<{ ticket: string; expires_in: number }>(`/${tenantSlug}/stream-ticket`, {}));
    } catch {
      scheduleReconnect();
      return;
    }
    if (closed.current) return;

    const wsBase = API_BASE.replace(/\/+$/, "").replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/${tenantSlug}/riders/me/notifications/stream?ticket=${encodeURIComponent(ticket)}`);
    wsRef.current = ws;
    ws.onopen = () => {
      attempt.current = 0;
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "notification" && msg.data) {
          qc.invalidateQueries({ queryKey: key(tenantSlug) });
          // A job change also changes the active job and the jobs lists.
          qc.invalidateQueries({ queryKey: ["active-delivery"] });
          qc.invalidateQueries({ queryKey: ["deliveries"] });
          onMessageRef.current?.(msg.data as InboxMessage);
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onclose = () => {
      scheduleReconnect();
    };
  }, [tenantSlug, qc]);

  useEffect(() => {
    closed.current = false;
    void connect();
    return () => {
      closed.current = true;
      if (timer.current) clearTimeout(timer.current);
      wsRef.current?.close(1000, "unmounted");
    };
  }, [connect]);
}

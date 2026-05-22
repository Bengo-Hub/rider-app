# Rider App Sprint 4 – Earnings Dashboard

**Status**: ✅ DONE
**Completed**: 2026-05-22

## Goals
- Earnings overview: today / week / month totals
- Earnings statements list with status
- Delivery history with per-delivery amounts

## Completed

### Earnings Hooks ✅ (`src/hooks/useEarnings.ts`)
- `useMyEarnings`: `GET /riders/me/earnings` — `{member_id, today, week, month, currency}` (matches backend)
- `useMyStatements`: `GET /riders/me/earnings/statements` — list of statements
- `useMyBillingEvents`: `GET /earnings/events` — per-event history; uses `occurred_at` (backend field name)

### Earnings Page ✅ (`/[orgSlug]/earnings/page.tsx`)
- Three tabs: Overview / Statements / History
- Overview: gradient card showing month total, today/week breakdown in sub-cards
- Statements: list with period, gross, net, status badge (paid/confirmed/draft)
- History: billing events with event type, amount, date (occurred_at)
- Loading states for all data sections
- Empty states with helpful messages

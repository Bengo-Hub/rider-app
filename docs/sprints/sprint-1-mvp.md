# Sprint 1: Rider App MVP Foundation

**Sprint**: 1
**Dates**: February 15-21, 2026
**Goal**: Build production-ready rider app with auth, core pages, PWA, and K8s

---

## Completed

### Task 1.1: Dependencies + Auth Integration
- Installed: zustand, @tanstack/react-query, axios, sonner, lucide-react, clsx, tailwind-merge, zod, react-hook-form, @hookform/resolvers
- Created Zustand auth store with persist middleware (`rider-auth-storage`)
- Created SSO API client (login, fetchMe, logout)
- Created useAuth hook (TanStack Query wrapping /api/v1/auth/me)
- Created ProtectedRoute component (redirects to /login when unauthenticated)
- Created AppProviders (QueryClient + Toaster + PWA install prompt)
- Created login page with Suspense boundary for useSearchParams
- Updated root layout with AppProviders wrapper
- Updated [orgSlug] layout with ProtectedRoute wrapper

### Task 1.2: Core Pages (5 pages rewritten)
- **Dashboard** (`/[orgSlug]`): Today's summary, active delivery banner, quick actions grid, available deliveries list with DeliveryCard components
- **Deliveries** (`/[orgSlug]/deliveries`): Tabbed filtering (All/Available/My Tasks), accept mutation, refresh button, loading/empty states
- **Active Delivery** (`/[orgSlug]/active`): 6-step status progression, pickup/dropoff cards with call/navigate buttons, advance/cancel actions
- **Earnings** (`/[orgSlug]/earnings`): Period tabs (Today/Week/Month), completed deliveries list with timestamps
- **Settings** (`/[orgSlug]/settings`): Profile card, menu items, logout with SSO API call

### Task 1.3: PWA + K8s
- Installed @ducanh2912/next-pwa
- Configured next.config.ts with PWA wrapper (Workbox service worker auto-generated)
- Created PWA install prompt component (captures beforeinstallprompt event)
- Build uses `--webpack` flag (Turbopack incompatible with next-pwa)
- K8s values.yaml updated with NEXT_PUBLIC_SSO_URL env var
- Safe area CSS for bottom nav on notched devices

### Shared Components Created
- `components/delivery/delivery-card.tsx` — Task card with accept button, pickup/dropoff addresses, time ago
- `components/delivery/active-delivery-view.tsx` — Full delivery tracker with status steps, navigation, call buttons
- `components/delivery/status-badge.tsx` — Color-coded status pill
- `components/layout/bottom-nav.tsx` — Fixed bottom tab bar (Home, Deliveries, Earnings, Settings)
- `components/pwa/pwa-install-prompt.tsx` — PWA install banner

### TanStack Query Hooks Created
- `useDeliveries` — Task list with status/rider/pagination filters
- `useActiveDelivery` — Current active task for rider (15s polling)
- `useTaskMutations` — accept, update status, cancel, submit proof
- `useRiderProfile` — Fleet member profile data

### Types Created
- `types/logistics.ts` — Task, FleetMember, TrackingInfo, ProofOfDelivery, status constants, next-status map

---

## Build Status
- **Routes**: 8 (/, /_not-found, /login, /[orgSlug], /[orgSlug]/active, /[orgSlug]/deliveries, /[orgSlug]/earnings, /[orgSlug]/settings)
- **Build**: `pnpm run build` — 0 errors
- **PWA**: Service worker generated at `/sw.js`
- **K8s**: ArgoCD app + Helm values configured

---

## Files Created/Modified (28 files)

### New Files (20)
- `src/store/auth-store.ts`
- `src/lib/auth-api.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useDeliveries.ts`
- `src/hooks/useActiveDelivery.ts`
- `src/hooks/useTaskMutations.ts`
- `src/hooks/useRiderProfile.ts`
- `src/types/logistics.ts`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/delivery/delivery-card.tsx`
- `src/components/delivery/active-delivery-view.tsx`
- `src/components/delivery/status-badge.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/pwa/pwa-install-prompt.tsx`
- `src/app/[orgSlug]/settings/page.tsx`
- `docs/plan.md`
- `docs/sprints/sprint-1-mvp.md`

### Modified Files (8)
- `package.json` (deps + --webpack build flag)
- `next.config.ts` (PWA wrapper)
- `src/app/layout.tsx` (AppProviders)
- `src/app/[orgSlug]/layout.tsx` (ProtectedRoute)
- `src/app/[orgSlug]/page.tsx` (full rewrite)
- `src/app/[orgSlug]/deliveries/page.tsx` (full rewrite)
- `src/app/[orgSlug]/active/page.tsx` (full rewrite)
- `src/app/[orgSlug]/earnings/page.tsx` (full rewrite)
- `src/app/login/page.tsx` (Suspense fix)
- `src/providers/app-providers.tsx` (PWA prompt)
- `src/lib/api.ts` (auth token header)
- `src/app/globals.css` (safe area CSS)

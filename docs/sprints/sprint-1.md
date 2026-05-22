# Rider App Sprint 1 – Foundation

**Status**: ✅ DONE
**Completed**: 2026-03-20

## Completed

### App Scaffold ✅
- Next.js 15 App Router, TypeScript, Tailwind CSS, PWA (next-pwa)
- `[orgSlug]/` layout with bottom navigation (Active, Deliveries, Earnings, Profile)
- Auth: SSO PKCE flow, `useAuth` hook, JWT management via `lib/api`
- Axios apiClient with Bearer header and 401 refresh interceptor

### Pages Scaffolded ✅
- `/[orgSlug]/active` — active delivery page
- `/[orgSlug]/deliveries` — delivery history list
- `/[orgSlug]/earnings` — earnings overview
- `/[orgSlug]/profile` — rider profile / KYC
- `/[orgSlug]/settings` — app settings
- `/join/[tenant]` — rider self-signup (pending member creation)

### Hooks ✅
- `useAuth` — token state, login/logout
- `useRiderProfile` — GET profile + onboarding fields
- `useDeliveries` — task list for rider
- `useActiveDelivery` — current in-progress task
- `useBrandConfig` — tenant branding from auth-api

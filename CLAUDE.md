# Rider App – Claude Code Guide

## Service
Next.js 15 PWA for riders: active delivery, GPS tracking, earnings, KYC/profile.  
**Production**: `https://riderapp.codevertexitsolutions.com`  
**K8s namespace**: `logistics`

## Architecture
- **Framework**: Next.js 15 App Router, TypeScript, Tailwind CSS, PWA (next-pwa)
- **State**: TanStack Query v5 for server state; Zustand for auth state
- **API**: shared Axios client (`lib/api`) → `https://logisticsapi.codevertexitsolutions.com/api/v1/{orgSlug}/*`
- **Auth**: SSO PKCE flow via auth-api; JWT Bearer injected by Axios interceptor
- **GPS**: `useLocationTracking` → `POST /{tenant}/telemetry/location` (15s interval)

## Key Directories
```
src/
  app/
    [orgSlug]/          # All authenticated rider pages
      active/           # Active delivery (GPS + status updates)
      deliveries/       # Delivery history list
      earnings/         # Earnings dashboard (Sprint 4)
      profile/          # Rider profile + KYC (Sprint 3)
      settings/         # App settings
    join/[tenant]/      # Self-signup (creates pending fleet member)
  hooks/
    useActiveDelivery.ts    # Current in-progress task
    useDeliveries.ts        # Task history
    useLocationTracking.ts  # GPS → telemetry API (fixed: uses /telemetry/location)
    useTaskMutations.ts     # Accept, status update (PATCH), PoD (fixed: uses /tasks/{id}/pod)
    useRiderProfile.ts      # Rider profile + onboarding fields
    useEarnings.ts          # Earnings summary + statements (TODO)
  lib/api/                  # Axios client
  types/logistics.ts        # Shared TypeScript types
```

## Development Commands
```bash
pnpm install        # install deps
pnpm dev            # start dev server
pnpm build          # full build (always run before pushing)
```

## API Endpoints Used
| Hook | Endpoint |
|------|----------|
| `useActiveDelivery` | `GET /tasks?status=in_progress` |
| `useDeliveries` | `GET /tasks?status=completed` |
| `useUpdateTaskStatus` | `PATCH /tasks/{id}/status` |
| `useSubmitProof` | `POST /tasks/{id}/pod` |
| `useLocationTracking` | `POST /telemetry/location` |
| `useRiderProfile` | `GET /riders/me/profile` |
| `useMyEarnings` (TODO) | `GET /riders/me/earnings` |

## Key Rules
- Always run `pnpm build` before pushing
- GPS hook sends `lat/lng/bearing_deg/speed_kph/accuracy_m` — match the API schema
- `useTaskMutations` uses PATCH for status updates (not PUT)
- `useSubmitProof` uses `/tasks/{id}/pod` (not `/deliveries/{id}/proof`)
- Image tags in devops-k8s values.yaml are set by build.sh only

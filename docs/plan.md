# Rider App — Implementation Plan

**Service**: logistics-service/rider-app
**Framework**: Next.js 16, React 19, TailwindCSS v4
**Status**: MVP Development (Feb 2026)
**Target**: March 17, 2026 MVP Launch

---

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1 (App Router, standalone output)
- **State**: Zustand (auth) + TanStack Query v5 (server state)
- **Styling**: Tailwind CSS v4 (mobile-first)
- **Auth**: SSO via auth-service (email/password → JWT)
- **API**: Logistics API (`/api/v1/{tenant}/tasks`, `/fleet-members`, `/tracking`)
- **PWA**: @ducanh2912/next-pwa with Workbox service worker
- **Icons**: Lucide React

### Route Structure
| Route | Page | Description |
|:---|:---|:---|
| `/` | Redirect | Redirects to `/{defaultTenant}` |
| `/login` | Login | Email/password auth via SSO |
| `/[orgSlug]` | Dashboard | Today's summary, active delivery, quick actions |
| `/[orgSlug]/deliveries` | Delivery Queue | Available/assigned tasks with accept |
| `/[orgSlug]/active` | Active Delivery | Status progression, navigation, cancel |
| `/[orgSlug]/earnings` | Earnings | Completed deliveries history |
| `/[orgSlug]/settings` | Settings | Profile, logout |

### Data Flow
```
Login → SSO /api/v1/auth/login → JWT + user stored in Zustand
All pages → ProtectedRoute guard → redirect to /login if unauthenticated
Task data → Logistics API /api/v1/{tenant}/tasks → TanStack Query cache
Status updates → PUT /tasks/{id}/status → invalidates query cache
```

### Key Design Decisions
1. **Mobile-first**: All touch targets 44x44px minimum, large buttons
2. **Orange theme**: `#FF6B35` primary color across all components
3. **Bottom navigation**: 4 tabs (Home, Deliveries, Earnings, Settings)
4. **Safe area padding**: PWA bottom nav respects device notches
5. **Offline-resilient**: TanStack Query retry + stale data display

---

## K8s Deployment
- **Namespace**: logistics
- **Ingress**: `rider.codevertexitsolutions.com`
- **Image**: `docker.io/codevertex/rider-app`
- **Resources**: 50m-250m CPU, 128Mi-512Mi memory
- **Health**: HTTP GET `/` with readiness/liveness probes
- **TLS**: Let's Encrypt via cert-manager

---

## MVP Scope
### In Scope
- Auth (login/logout via SSO)
- Delivery queue (list pending tasks)
- Accept/reject deliveries
- Active delivery status progression
- Completed deliveries list
- PWA install prompt
- Settings with logout

### Post-MVP
- GPS background tracking
- Push notifications (FCM/APNS)
- Proof of delivery (photo upload)
- Offline task queue
- Earnings aggregation API
- Rider shift toggle

# Rider App Sprint 2 – Active Delivery & GPS Tracking

**Status**: ✅ DONE (core complete; push/offline deferred to Sprint 5)
**Completed**: 2026-05-22

## Goals
- Active delivery screen with task details and status progression
- GPS location tracking wired to telemetry API
- Proof of delivery submission

## Completed

### Active Delivery Screen ✅
- `useActiveDelivery` hook: polls `GET /tasks` for in-progress task
- Status cards: pickup address, dropoff address, customer contact
- `useTaskMutations`: accept, status update (PATCH /tasks/{id}/status), cancel (also PATCH /status with status=cancelled — no separate /cancel route)

### GPS Location Tracking ✅ (fixed)
- `useLocationTracking` hook: `navigator.geolocation.watchPosition` at 15s interval
- Sends to `POST /{tenant}/telemetry/location` with correct payload (`lat/lng`, `bearing_deg`, `speed_kph`)
- `use-delivery-route` hook: fetches Valhalla route for active task

### Proof of Delivery ✅
- `useSubmitProof` mutation: `POST /tasks/{id}/pod`
- Camera capture: `<input type="file" accept="image/*" capture="environment">` + canvas resize to 800px JPEG
- COD collection UI: amber banner + amount input pre-filled from `task.metadata.cash_on_delivery`
- OTP / delivery code input field (maps to `delivery_code` in PoD payload)
- GPS auto-capture on PoD submit (navigator.geolocation.getCurrentPosition)

## Deferred to Sprint 5

- Push notification for new task assignment (Web Push / FCM) → Sprint 5
- Offline task queue with service worker background sync → Sprint 5

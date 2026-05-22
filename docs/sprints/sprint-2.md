# Rider App Sprint 2 – Active Delivery & GPS Tracking

**Status**: ⚠️ PARTIAL (~60% done)
**Target**: 2026-06-07

## Goals
- Active delivery screen with task details and status progression
- GPS location tracking wired to telemetry API
- Proof of delivery submission

## Completed

### Active Delivery Screen ✅
- `useActiveDelivery` hook: polls `GET /tasks` for in-progress task
- Status cards: pickup address, dropoff address, customer contact
- `useTaskMutations`: accept, status update (FIXED: uses PATCH not PUT)

### GPS Location Tracking ✅ (fixed)
- `useLocationTracking` hook: `navigator.geolocation.watchPosition` at 15s interval
- **Fixed**: now sends to `POST /{tenant}/telemetry/location` (was `/tracking/rider/location`)
- **Fixed**: payload field names match API (`lat/lng`, `bearing_deg`, `speed_kph`)
- `use-delivery-route` hook: fetches Valhalla route for active task

### Proof of Delivery ✅ (fixed)
- `useSubmitProof` mutation: **Fixed** to use `POST /tasks/{id}/pod` (was `/deliveries/{id}/proof`)
- Proof payload: photo_url, recipient_name, notes, lat/lng

## Remaining

- [ ] Camera capture for PoD photo (use MediaDevices API, upload to `/media/upload`)
- [ ] OTP verification flow on PoD submission
- [ ] COD collection UI (show amount, mark collected)
- [ ] Push notification for new task assignment (Web Push / FCM)
- [ ] Offline task queue with service worker background sync

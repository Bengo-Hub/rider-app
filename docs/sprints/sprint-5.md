# Rider App Sprint 5 – PWA & Offline

**Status**: ⬜ NOT STARTED
**Target**: 2026-07-19

## Goals
- Full PWA: install prompt, offline capability, background GPS
- Push notifications for task assignment
- Offline task queue with background sync

## Tasks

- [ ] Service worker: cache API responses, queue location POST when offline
- [ ] Background sync: flush offline location pings when reconnected
- [ ] Install prompt component: `BeforeInstallPrompt` event, show banner
- [ ] Web Push: subscribe to push notifications; show task assignment alerts
- [ ] `use-pwa-update` hook: already exists — wire update banner UI
- [ ] Offline mode indicator in app header
- [ ] Task accept/decline while offline → sync when online

## Fixes 2026-10-11

- [x] Access follows the fleet membership from logistics `/riders/me` (active in, pending KYC blocked, under review with a banner, rejected or suspended refused) instead of the SSO account status and the SSO role `rider` (`643d00c`).
- [x] Proof of delivery asks for the customer's code only when the task has one (`pod_code_required`); till and transfer deliveries take the recipient's name instead (`6e40739`).
- [x] Jobs in the older `en_route` status stay on the active screen; one `ACTIVE_STATUSES` list (`ff4b7eb`).
- [x] Staff riders (HR-vetted employees) skip the KYC uploads (`06ecc2e`).
- [x] e2e rider account from `.env.test` only (`b4945ba`).
- [x] Staff riders: Earnings opens on Per diem (completed trips with the HR claim state, claim or re-claim with days).

## Uber/Bolt parity 2026-10-13

- [x] Online/offline switch in the header (was a hard-coded "Online" badge) on logistics `/riders/me/shift`: online starts the rider's scheduled shift or an open-ended one; offline ends it and drops the rider from auto-dispatch at once.
- [x] `LocationBeacon` sends the rider's position on every screen while online or on a job. Only the active-job screen used to send it, so an idle rider waiting for work was never fresh enough for auto-dispatch to offer them a job. The active screen now reads the position for its map without posting it twice.
- [x] A job taken away (cancelled, or moved by a dispatcher) shows a notice in the app; a push is sent too (logistics `e4560a5`, notifications-api `01efa0b`). A rider who declined a job is not told about it.
- [x] "Get paid" tab: M-Pesa number or bank account on `/riders/me/payout-method` (the API normalises and validates; nothing could set it before).
- [x] Job history detail (`/deliveries/{id}`): stops, area, distance, timeline, pay or per diem, cancel or failure reason. "My jobs" used to open the active screen even for finished jobs.
- [x] `returned` status label and badge. Header bell opens notification settings (it showed a permanent unread dot), and the Settings menu item works.

Open: an in-app notification inbox (logistics notifications are dispatcher alerts with no recipient; a rider inbox needs a recipient column, see the plan).

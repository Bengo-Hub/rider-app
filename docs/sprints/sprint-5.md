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

Open: online/offline toggle backed by shifts with continuous location; notifications list with live updates and notices for cancelled or reassigned jobs; payout method screen; job history detail; `returned` status; per diem claim screen for staff riders.

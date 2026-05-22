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

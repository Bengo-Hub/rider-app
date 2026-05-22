# Rider App Sprint 3 – KYC & Profile

**Status**: ⚠️ PARTIAL (~40% done)
**Target**: 2026-06-21

## Goals
- Full KYC submission flow with photo capture
- Profile edit (name, phone, license number)
- Rider self-signup via /join

## Completed
- Profile page: shows rider info, KYC status badge
- `/join/[tenant]` page: collect email/phone → create pending fleet member

## Remaining

- [ ] KYC document upload: capture photo (camera API) → `POST /media/upload` → submit URL
- [ ] Document types: ID/Passport, driver's license, selfie
- [ ] KYC status display: pending / under_review / approved / rejected
- [ ] Profile edit form: name, phone, id_number, license_no
- [ ] Vehicle info display (assigned vehicle plate, type)

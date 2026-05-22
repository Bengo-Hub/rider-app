# Rider App Sprint 3 – KYC & Profile

**Status**: ⚠️ PARTIAL (~70% done)
**Target**: 2026-06-21

## Goals
- Full KYC submission flow with photo capture
- Profile edit (name, phone, license number)
- Rider self-signup via /join

## Completed

### KYC Document Upload ✅
- Profile page has full KYC upload form: ID/Passport copy, rider passport photo, vehicle license plate photo, vehicle side view photo
- Uses `ImageUpload` component for each doc (file picker + preview)
- Submits all URLs via `PATCH /riders/me/profile`

### Self-Signup ✅
- `/join/[tenant]` page: collect email/phone → create pending fleet member

### Profile Edit ✅
- Phone, vehicle type, license plate, driving license, National ID/Passport number fields
- Vehicle type selector (motorbike, car, van, truck)

### Profile View ✅
- Profile page shows KYC status badge (pending/under_review/approved/rejected)
- Uses `useAuthStore` to pre-populate phone from JWT claims

## Remaining

- [ ] Fetch and pre-fill all fields from `GET /riders/me` on page load (license_no, id_number etc.)
- [ ] Vehicle info display: show assigned vehicle plate/type from fleet member response
- [ ] KYC status per-document (id_passport / selfie / license) — API exposes fields on FleetMember

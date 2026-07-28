# Deferred Salon & Super-Admin Features — Implementation Plan

## Status
- **Plan approved:** Pending review
- **Tracker:** `915-Deferred-Salon-Admin-Features-Tracker.md`
- **Overall progress:** 0%

## Context
This plan covers 4 deferred items from `To-Be-Discussed.md` that are now unblocked or have clear paths forward. D-6 and D-7 were researched and found **already implemented**; they are excluded from this plan.

**Current state summary:**
- **D-2 Salon localization (Twi/Ga):** Partial — custom `useI18n` composable exists with `en`/`tw`/`gaa` translations, ~8 of 25 salon views localized, but not wired globally and coverage is incomplete.
- **D-3 Salon Phase 6 WhatsApp payments full flow:** Partial — backend WhatsApp appointment state machine exists with Paystack `initializeCharge`, but no MoMo integration, no salon-specific payment confirmation webhook handling, no refund UI.
- **D-4 Salon Phase 7 Stylist commissions:** Not implemented — no commission model, DAO, controller, or UI. Must be **toggleable per-salon** since not all salons want commissions.
- **D-5 Salon Phase 7 Offline PWA:** Not implemented — no service worker, manifest, or caching strategy. Needs design decision before implementation.

---

## Approach

### 1. D-2: Complete Salon Localization (Twi/Ga)

**Goal:** Wire existing custom i18n composable globally and complete translation coverage for all salon views.

**Slice 1: Global i18n wiring**
- Wire `useI18n` composable into `App.vue` as global provide/inject or Pinia store
- Add locale switcher to salon layout (`SalonLayout.vue` or `TenantLayout.vue`)
- Persist locale selection in `users.locale` via existing `/auth/locale` endpoint
- Verify: `cd front-end && npm run lint && npm run build && npm run test:unit` passes

**Slice 2: Complete translation coverage**
- Audit all 25+ salon views for hardcoded English strings
- Add missing translation keys to `front-end/src/locales/index.ts` for `en`/`tw`/`gaa`
- Replace hardcoded strings with `t()` calls in remaining salon views
- Prioritize: appointment flow, calendar, reports, walk-in queue, staff shifts
- Verify: build + tests pass; visual inspection of locale switcher

**Slice 3: Backend locale-aware responses**
- Ensure backend error messages, validation errors, and email/SMS templates respect `users.locale`
- Add locale to JWT payload or fetch from DB on each request
- Verify: backend tests pass

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| **Keep custom `useI18n` composable** | Already implemented and working; no need to migrate to `vue-i18n` package. Adding a new dependency would require `vue-tsc` fixes and increases bundle size. |
| **Twi + Ga only** | Matches Ghana market; `en` is default fallback. |
| **Persist in `users.locale`** | Already has DB column and backend endpoint. |
| **No tenant-level locale override** | Locale is user preference, not tenant configuration. |

**Files to modify:**
| File | Change |
|------|--------|
| `front-end/src/App.vue` | **Modify** — provide i18n composable globally |
| `front-end/src/layouts/TenantLayout.vue` | **Modify** — add locale switcher |
| `front-end/src/composables/useI18n.ts` | **Modify** — extend translation coverage |
| `front-end/src/locales/index.ts` | **Modify** — add missing keys for all salon views |
| `front-end/src/views/salon/*.vue` | **Modify** — replace hardcoded strings with `t()` |
| `back-end/src/controllers/auth.controller.js` | **Modify** — ensure locale in JWT/response |
| `back-end/src/middleware/auth.js` | **Modify** — fetch locale from DB if not in token |

---

### 2. D-3: Salon Phase 6 — WhatsApp Payments Full Flow

**Goal:** Complete the WhatsApp payment flow with MoMo integration, salon-specific payment confirmation, and refund UI.

**Slice 1: MoMo provider integration**
- Add MoMo (Mobile Money) as a payment channel alongside Paystack in `paystack.service.js` or new `momo.service.js`
- Add `salon_payment_config` fields for MoMo provider selection (MTN MoMo, Vodafone Cash, AirtelTigo Money)
- Update WhatsApp appointment state machine to support MoMo payment link generation
- Add backend tests for MoMo payment initialization
- Verify: `cd back-end && npm test` passes

**Slice 2: Salon-specific payment confirmation webhook**
- Add webhook endpoint `/api/v1/salon/whatsapp/payment-confirmation` that handles Paystack/MoMo callbacks specific to salon WhatsApp bookings
- Update `whatsappAppointment.service.js` to transition appointment state on payment confirmation
- Send confirmation message to customer via WhatsApp
- Add tests for webhook handling
- Verify: backend tests pass

**Slice 3: Refund/void UI for WhatsApp bookings**
- Add backend endpoint `POST /api/v1/salon/whatsapp/bookings/:id/refund`
- Add refund button to `SalonWhatsAPPaymentsView.vue`
- Wire refund flow with Paystack/MoMo refund API
- Add tests
- Verify: frontend build + tests pass

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| **MoMo via Paystack or direct?** | Paystack supports MoMo collections; use Paystack for consistency unless tenant requests direct MoMo API. |
| **Salon-specific webhook vs generic** | Salon appointments need state machine transitions; generic Paystack webhook doesn't know about salon booking states. Separate endpoint keeps concerns separated. |
| **Refund eligibility** | Only allow refund before appointment start time; after that, require manager approval. |
| **Toggleable per-salon** | Some salons may not offer online payments; gate behind `salon_payment_config.enabled`. |

**Files to modify:**
| File | Change |
|------|--------|
| `back-end/src/tenant-platform/services/paystack.service.js` | **Modify** — add MoMo support |
| `back-end/src/verticals/salon/services/whatsappAppointment.service.js` | **Modify** — add MoMo flow, update state machine |
| `back-end/src/tenant-platform/controllers/salonWhatsApp.controller.js` | **Create** — salon-specific payment confirmation webhook |
| `back-end/src/tenant-platform/routes/salonWhatsApp.router.js` | **Modify** — add webhook route |
| `front-end/src/views/salon/SalonWhatsAPPaymentsView.vue` | **Modify** — add refund button + flow |
| `front-end/src/views/salon/SalonSettingsView.vue` | **Modify** — add MoMo provider selection |

---

### 3. D-4: Salon Phase 7 — Toggleable Stylist Commissions

**Goal:** Add per-salon toggleable stylist commission tracking with configurable rates and payout history.

**Slice 1: Commission model + DAO**
- Create migration `20260728000001-create-stylist-commissions.js`
- Create `stylistCommission` model: `id`, `tenantId`, `stylistId`, `appointmentId`, `rateType` (percentage/fixed), `rateValue`, `amount`, `status` (pending/paid/void), `paidAt`, `createdAt`, `updatedAt`
- Create `stylistCommission.dao.js` with CRUD + `calculateCommission(appointmentId)` + `getCommissionSummary(stylistId, dateRange)`
- Add controller tests
- Verify: `cd back-end && npm test` passes

**Slice 2: Commission controller + routes**
- Create `stylistCommission.controller.js`:
  - `listCommissionsHandler` — list with filters (stylist, date range, status)
  - `createCommissionHandler` — auto-create on appointment completion
  - `updateCommissionHandler` — mark as paid/void
  - `getCommissionSummaryHandler` — totals per stylist
- Create `stylistCommission.router.js` under salon routes
- Mount in `server.js`
- Add tests
- Verify: backend tests pass

**Slice 3: Commission UI**
- Add commission tab to `SalonStaffView.vue` or create `SalonCommissionsView.vue`
- Show commission rates per stylist, pending/paid history, payout summary
- Add toggle in `SalonSettingsView.vue`: "Enable stylist commissions" (boolean)
- Wire toggle to `salon_settings` or new `salon_feature_flags`
- Verify: frontend build + tests pass

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| **Toggleable per-salon** | Not all salons want commissions; must be opt-in. |
| **Auto-calculate on appointment completion** | Commission is created when appointment is marked complete, not on booking. |
| **Rate types** | Support both percentage of service price and fixed amount per service. |
| **No automatic payouts** | Salons have different payout schedules; super-admin marks commissions as paid manually or via batch. |

**Files to modify:**
| File | Change |
|------|--------|
| `back-end/src/db/models/stylistCommission.js` | **Create** — Sequelize model |
| `back-end/src/DAOs/stylistCommission.dao.js` | **Create** — DAO |
| `back-end/src/controllers/stylistCommission.controller.js` | **Create** — controller |
| `back-end/src/routes/stylistCommission.router.js` | **Create** — router |
| `back-end/src/utils/server.js` | **Modify** — mount routes |
| `front-end/src/views/salon/SalonCommissionsView.vue` | **Create** — commission dashboard |
| `front-end/src/views/salon/SalonStaffView.vue` | **Modify** — add commission tab |
| `front-end/src/views/salon/SalonSettingsView.vue` | **Modify** — add commission toggle |

---

### 4. D-5: Salon Phase 7 — Offline PWA (Move to To-Be-Discussed)

**Goal:** Do NOT implement yet. Add to `To-Be-Discussed.md` as a design decision requiring business input.

**Why defer further:**
- Offline PWA for a salon booking system raises complex questions:
  - What data is safe to cache locally? (Appointments, client PII, payment info)
  - How does offline booking sync when connection returns? (Conflict resolution)
  - Does offline mode need to support full POS or just viewing?
  - Ghana connectivity varies by location; is PWA the right solution vs progressive web app with sync?
- These are product/architecture decisions, not just engineering tasks.

**Action:**
- Update `To-Be-Discussed.md` with specific questions for salon offline strategy
- No code changes until decisions are made

---

## Incremental Implementation Rules

1. **One slice at a time** — complete, test, verify, commit before next slice
2. **Multi-tenant isolation** — all new data scoped by `tenantId`; platform routes gated by `requireSuperAdmin`
3. **Toggleable features** — commissions and MoMo payments must be per-salon opt-in
4. **No new dependencies without review** — D-2 uses existing custom i18n, not `vue-i18n` package
5. **Tests first where possible** — backend tests required for all new controllers/DAOs

---

## Verification Matrix

| Slice | Backend tests | Frontend lint | Frontend build | Frontend tests |
|-------|--------------|---------------|----------------|----------------|
| D-2 Slice 1 | — | Pass | Pass | Pass |
| D-2 Slice 2 | — | Pass | Pass | Pass |
| D-2 Slice 3 | Pass | Pass | Pass | Pass |
| D-3 Slice 1 | Pass | — | — | — |
| D-3 Slice 2 | Pass | — | — | — |
| D-3 Slice 3 | Pass | Pass | Pass | Pass |
| D-4 Slice 1 | Pass | — | — | — |
| D-4 Slice 2 | Pass | — | — | — |
| D-4 Slice 3 | — | Pass | Pass | Pass |

---

## STOP Conditions

- **D-2 scope creep:** Do NOT migrate to `vue-i18n` package. Keep custom composable. If translation coverage proves insufficient, extend the custom composable rather than replacing it.
- **D-3 payment scope:** Do NOT build customer-facing checkout flow. This plan covers admin UI + backend payment confirmation only. Customer checkout is a separate product decision.
- **D-4 commission immutability:** Once a commission is marked `paid`, it must not be auto-recalculated. If business rules require adjustments, require explicit void + recreate.
- **D-5 premature implementation:** Do NOT start PWA implementation until product/architecture decisions are documented in `To-Be-Discussed.md`.
- **D-2/D-3/D-4 tenant isolation:** All new data must be scoped by `tenantId`. Never return cross-tenant data.
- **D-3/D-4 toggleability:** Both features must be per-salon opt-in. Do not enable by default for existing salons.

---

## Out of Scope

- **D-1** `useReservationCalendar()` composable extraction — deferred, divergent data shapes
- **D-5** Offline PWA — moved to To-Be-Discussed pending design decisions
- **D-6** Advanced analytics — already implemented
- **D-7** Compliance automation — already implemented
- **D-8** MySQL partitioning — permanently rejected
- **Customer-facing checkout** — separate product decision
- **Salon Phase 7 offline PWA** — requires design decision first

---

## Files to Create/Modify Summary

| File | Action | Item |
|------|--------|------|
| `front-end/src/App.vue` | Modify | D-2 |
| `front-end/src/layouts/TenantLayout.vue` | Modify | D-2 |
| `front-end/src/composables/useI18n.ts` | Modify | D-2 |
| `front-end/src/locales/index.ts` | Modify | D-2 |
| `front-end/src/views/salon/*.vue` | Modify (multiple) | D-2 |
| `back-end/src/controllers/auth.controller.js` | Modify | D-2 |
| `back-end/src/middleware/auth.js` | Modify | D-2 |
| `back-end/src/tenant-platform/services/paystack.service.js` | Modify | D-3 |
| `back-end/src/verticals/salon/services/whatsappAppointment.service.js` | Modify | D-3 |
| `back-end/src/tenant-platform/controllers/salonWhatsApp.controller.js` | Create | D-3 |
| `back-end/src/tenant-platform/routes/salonWhatsApp.router.js` | Modify | D-3 |
| `front-end/src/views/salon/SalonWhatsAPPaymentsView.vue` | Modify | D-3 |
| `front-end/src/views/salon/SalonSettingsView.vue` | Modify | D-3 |
| `back-end/src/db/models/stylistCommission.js` | Create | D-4 |
| `back-end/src/DAOs/stylistCommission.dao.js` | Create | D-4 |
| `back-end/src/controllers/stylistCommission.controller.js` | Create | D-4 |
| `back-end/src/routes/stylistCommission.router.js` | Create | D-4 |
| `back-end/src/utils/server.js` | Modify | D-4 |
| `front-end/src/views/salon/SalonCommissionsView.vue` | Create | D-4 |
| `front-end/src/views/salon/SalonStaffView.vue` | Modify | D-4 |
| `To-Be-Discussed.md` | Modify | D-5 |

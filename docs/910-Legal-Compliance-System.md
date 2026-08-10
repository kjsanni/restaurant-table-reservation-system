---
title: Legal & Compliance System
date: 2026-07-20
tags:
  - legal
  - compliance
  - ghana
  - data-protection
  - privacy
  - payments
  - frontend
  - backend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[911-Legal-Acceptance-Audit-Trail]]"
  - "[[505-Payment-System]]"
  - "[[903-Tenant-Platform-Module]]"
  - "[[902-Improvement-Recommendations]]"
---

# Legal & Compliance System

> [!abstract] Purpose
> The legal document set for the Restaurant Table Reservation System (RTRS), operated by **Vibespot Technologies Ltd.** (Republic of Ghana), localised for Ghana and wired into the app. Source of truth: `legal/` in the repo root; rendered at `/legal/:slug`.

---

## Jurisdiction & Framework

- **Operator:** Vibespot Technologies Ltd. — incorporated in the **Republic of Ghana**.
- **Primary data-protection law:** **Data Protection Act, 2012 (Act 843)**, supervised by the **Data Protection Commission of Ghana** (https://dpc.gov.gh).
- **Secondary (EU/UK subjects):** GDPR — see `gdpr` document + [[911-Legal-Acceptance-Audit-Trail]].
- **Payments:** **Ghana Cedi (GHS)** via **Paystack** (Mobile Money: MTN, Vodafone Cash, AirtelTigo Money; cards; banks) under **Bank of Ghana** directives; **GRA** tax/VAT obligations.

---

## Documents (9 total)

| Slug | File | Route | Audience |
|---|---|---|---|
| `privacy` | `PRIVACY_POLICY.md` | `/legal/privacy` | Everyone (Ghana DPA 2012 + GDPR) |
| `terms` | `TERMS_OF_SERVICE.md` | `/legal/terms` | All users |
| `cookies` | `COOKIE_POLICY.md` | `/legal/cookies` | Everyone |
| `gdpr` | `GDPR_COMPLIANCE.md` | `/legal/gdpr` | EU/UK data subjects |
| `dpa` | `DATA_PROCESSING_AGREEMENT.md` | `/legal/dpa` | Tenant restaurants |
| `customer` | `CUSTOMER_POLICY.md` | `/legal/customer` | Guests booking/paying |
| `tenant` | `TENANT_POLICY.md` | `/legal/tenant` | Restaurants (Merchants) |
| `payment-refund` | `PAYMENT_REFUND_POLICY.md` | `/legal/payment-refund` | Customers & Merchants |
| `accessibility` | `ACCESSIBILITY_STATEMENT.md` | `/legal/accessibility` | Everyone |

`legal/README.md` is the index (doc table, editing notes, production placeholders).

---

## Frontend Wiring

- **Manifest:** `front-end/src/config/legalDocuments.ts` — typed `Record<slug, { title, lastUpdated, description, sections }>`. Single source of rendered content; version-controlled.
- **View:** `front-end/src/views/legal/LegalDocumentView.vue` — branded doc viewer with sidebar nav + cross-links; public route (no auth).
- **Router:** `front-end/src/router/index.js` — `GET /legal/:slug` (`legal-document`).
- **Footer:** `front-end/src/App.vue` — links to Privacy, Terms, Cookies, GDPR, DPA, Customers, Merchants, Payments, Accessibility.
- **Customer portal:** `customer/CustomerPortalProfileView.vue` + `customer/CustomerPortalReservationsView.vue` — "Policies & Payments" card linking Customer Policy, Payment & Refund, Privacy.
- **Onboarding acceptance:** `admin/OnboardingChecklistView.vue` — two **required** policy steps (Merchant Policy, DPA) with server-recorded acceptance; see [[911-Legal-Acceptance-Audit-Trail]].

## Backend Wiring

- **Public API:** `GET /api/v1/legal` (list) + `GET /api/v1/legal/:slug` (parsed markdown sections). Router `back-end/src/routes/legal.router.js`, mounted **publicly** in `server.js` (before tenant/CSRF gating). Reads the `legal/*.md` files directly (single source of truth, SEO/crawler friendly).
- **Acceptance API:** `GET/POST /api/v1/admin/tenants/:tenantId/legal-acceptances` — see [[911-Legal-Acceptance-Audit-Trail]].

---

## Production Placeholders (fill before launch)

- Monitored mailboxes: `privacy@`, `legal@`, `accessibility@vibespot.tech`.
- Ghana company registration number (Registrar-General's Department).
- GRA VAT registration number (merchant invoices).
- Confirm Paystack is the live Ghana processor; confirm sub-processor list with counsel.
- Governing law / dispute venue: Republic of Ghana (already stated in docs).

---

## Key Files

| Layer | File |
|---|---|
| Docs | `legal/*.md`, `legal/README.md` |
| Frontend manifest | `front-end/src/config/legalDocuments.ts` |
| Frontend view | `front-end/src/views/legal/LegalDocumentView.vue` |
| Frontend service | `front-end/src/services/legalAcceptanceAPI.js` |
| Backend list API | `back-end/src/routes/legal.router.js` |
| Acceptance API | `back-end/src/tenant-platform/{routes,controllers,DAOs}/legalAcceptance.*` |
| Acceptance model/migration | `back-end/src/db/{models/legalAcceptance.js, migrations/20260720000002-create-legal-acceptances.js}` |

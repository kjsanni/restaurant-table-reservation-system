---
title: Legal Acceptance Audit Trail
date: 2026-07-20
tags:
  - legal
  - compliance
  - audit
  - ghana
  - data-protection
  - backend
  - database
related:
  - "[[910-Legal-Compliance-System]]"
  - "[[903-Tenant-Platform-Module]]"
  - "[[701-Audit-Log]]"
  - "[[505-Payment-System]]"
---

# Legal Acceptance Audit Trail (Tamper-Evident)

> [!abstract] Harder guarantee
> When a restaurant (Tenant) accepts the **Merchant Policy** (`tenant`) or **Data Processing Agreement** (`dpa`) during onboarding, the acceptance is written as an **immutable** record — not a mutable checkbox. This satisfies evidence requirements under Ghana's Data Protection Act, 2012 (Act 843) and the GDPR.

---

## Database Table — `legal_acceptances`

Created by migration `20260720000002-create-legal-acceptances.js`.

| Column | Type | Purpose |
|---|---|---|
| `id` | INT PK auto-increment | Surrogate key |
| `tenantId` | INT NOT NULL | Which restaurant accepted |
| `userId` | INT NULL | Who accepted (admin/staff user id) |
| `slug` | VARCHAR(100) NOT NULL | Document accepted (`tenant`, `dpa`, …) |
| `version` | VARCHAR(30) NOT NULL | Document version at acceptance time |
| `ipAddress` | VARCHAR(45) NULL | Source IP (`req.ip`) |
| `userAgent` | VARCHAR(512) NULL | Browser/client string |
| `createdAt` | DATETIME NOT NULL | Exact timestamp |

Indexes: `tenantId`, `slug`, `(tenantId, slug)`, `createdAt`.

> [!warning] Immutability
> The model sets `updatedAt: false`; the DAO only **creates** and **lists** — no update/delete. Acceptance rows are never modified or removed, giving a verifiable, append-only trail.

---

## Versioning

Document versions live in a shared constant on both sides:
- Backend: `LEGAL_DOCUMENT_VERSIONS` in `back-end/src/tenant-platform/controllers/legalAcceptance.controller.js`
- Frontend: `LEGAL_DOCUMENT_VERSIONS` in `front-end/src/services/legalAcceptanceAPI.js`

To re-require acceptance after editing a policy, **bump that slug's version** in both maps. The onboarding UI only treats a policy as "accepted" when a server record exists at the **current** version.

---

## API

Base: `/api/v1/admin/tenants/:tenantId/legal-acceptances`
Guarded by `protect` + `requirePermission("manage_tenants")` + CSRF (same as other tenant routes).

| Method | Path | Behaviour |
|---|---|---|
| GET | `/:tenantId/legal-acceptances` | List all acceptances for tenant (newest first); returns `items: [{ slug, version, acceptedAt, acceptedBy, ipAddress }]` |
| POST | `/:tenantId/legal-acceptances` | Body `{ slug }`. Validates slug against `LEGAL_DOCUMENT_VERSIONS`; records `userId` (from `req.user`), `version`, `req.ip`, `user-agent`. Returns `201` with the record. Unknown/missing slug → `400`. |

Files: `back-end/src/tenant-platform/{routes,controllers,DAOs}/legalAcceptance.*`, model `back-end/src/db/models/legalAcceptance.js`, mounted in `server.js`.

---

## Enforcement (Frontend)

`front-end/src/views/admin/OnboardingChecklistView.vue`:
- On mount, loads existing acceptances (`legalAcceptanceAPI.getAcceptances`) and maps them by slug.
- Two required steps (Merchant Policy, DPA) are driven by the **server record** (version-checked), not a local checkbox.
- Toggling a required policy step calls `legalAcceptanceAPI.acceptDocument(tenantId, slug)` → POST.
- **"Mark Complete" is blocked** while any required policy lacks a current-version server acceptance (`missingRequired` guard).
- Accepted steps show permanent evidence: `Accepted vX on <timestamp> from <ip>. Record is permanent.`

---

## Key Files

| Layer | File |
|---|---|
| Migration | `back-end/src/db/migrations/20260720000002-create-legal-acceptances.js` |
| Model | `back-end/src/db/models/legalAcceptance.js` |
| DAO | `back-end/src/tenant-platform/DAOs/legalAcceptance.dao.js` |
| Controller | `back-end/src/tenant-platform/controllers/legalAcceptance.controller.js` |
| Routes | `back-end/src/tenant-platform/routes/legalAcceptance.router.js` |
| Frontend service | `front-end/src/services/legalAcceptanceAPI.js` |
| Frontend consumer | `front-end/src/views/admin/OnboardingChecklistView.vue` |

---

## Caveats / Follow-ups

- `req.ip` resolves to `::ffff:127.0.0.1` locally (IPv4-mapped IPv6) — normal behind the proxy config; correct in production once `trust proxy` is set.
- A customer-facing deposit/checkout consent checkbox (reusing this acceptance model) is **not yet built** — there is no shopfront checkout in the B2B app today. Add it when a customer deposit flow exists (see [[902-Improvement-Recommendations]]).
- `legal_acceptances` is applied via the normal `sequelize-cli db:migrate` path (the pre-existing partition migrations were fixed 2026-07-20 so `db:migrate` runs cleanly end-to-end; see [[903-Tenant-Platform-Module]] §9).

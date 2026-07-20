# Legal & Compliance Documents

These documents govern the Restaurant Table Reservation System (RTRS) operated by **Vibespot Technologies Ltd.** (a company incorporated in the **Republic of Ghana**). They are rendered as public pages in the frontend at `/legal/:slug` (see `front-end/src/views/legal/LegalDocumentView.vue`).

All documents are localised for Ghana: primary data-protection framework is the **Data Protection Act, 2012 (Act 843)** supervised by the **Data Protection Commission of Ghana**; payments are in **Ghana Cedi (GHS)** via **Paystack** (Mobile Money, cards, banks) under **Bank of Ghana** directives.

| Document | File | Route | Audience |
|---|---|---|---|
| Privacy Policy | [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | `/legal/privacy` | Everyone (Ghana DPA 2012 + GDPR) |
| Terms of Service | [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md) | `/legal/terms` | All users |
| Cookie Policy | [COOKIE_POLICY.md](./COOKIE_POLICY.md) | `/legal/cookies` | Everyone |
| GDPR Compliance Statement | [GDPR_COMPLIANCE.md](./GDPR_COMPLIANCE.md) | `/legal/gdpr` | EU/UK data subjects |
| Data Processing Agreement | [DATA_PROCESSING_AGREEMENT.md](./DATA_PROCESSING_AGREEMENT.md) | `/legal/dpa` | Tenant restaurants |
| Customer Policy | [CUSTOMER_POLICY.md](./CUSTOMER_POLICY.md) | `/legal/customer` | Guests booking/paying |
| Tenant (Merchant) Policy | [TENANT_POLICY.md](./TENANT_POLICY.md) | `/legal/tenant` | Restaurants using RTRS |
| Payment & Refund Policy | [PAYMENT_REFUND_POLICY.md](./PAYMENT_REFUND_POLICY.md) | `/legal/payment-refund` | Customers & Merchants |
| Accessibility Statement | [ACCESSIBILITY_STATEMENT.md](./ACCESSIBILITY_STATEMENT.md) | `/legal/accessibility` | Everyone |

## Editing

Edit the Markdown source in this folder. The frontend reads the documents from a static manifest (`front-end/src/config/legalDocuments.ts`) so that content stays in version control and can be reviewed via pull request.

## Acceptance records (tamper-evident audit trail)

When a restaurant accepts the **Merchant Policy** or **DPA** during onboarding, the acceptance is written as an **immutable** row in the `legal_acceptances` table (`back-end/src/db/migrations/20260720000002-create-legal-acceptances.js`):

| Column | Purpose |
|---|---|
| `tenantId` | Which restaurant accepted |
| `userId` | Who accepted (admin/staff user id) |
| `slug` | Document accepted (`tenant`, `dpa`, …) |
| `version` | Document version at time of acceptance (bump in `LEGAL_DOCUMENT_VERSIONS` when content changes) |
| `ipAddress` | Source IP (`req.ip`) |
| `userAgent` | Browser/client string |
| `createdAt` | Exact timestamp |

Rows are **never updated or deleted**. API: `GET/POST /api/v1/admin/tenants/:tenantId/legal-acceptances` (controller `back-end/src/tenant-platform/controllers/legalAcceptance.controller.js`). The onboarding UI (`front-end/src/views/admin/OnboardingChecklistView.vue`) reads existing acceptances and blocks "Mark Complete" until both required policies are accepted at the current version.

## Placeholders to customise before production

- `privacy@vibespot.tech`, `legal@vibespot.tech`, `accessibility@vibespot.tech` — replace with real monitored mailboxes.
- Registered Ghana company address and registration number (Registrar-General's Department).
- GRA VAT registration number to display on merchant invoices.
- Confirm Paystack is the live processor for Ghana and the sub-processor list with counsel.
- Confirm governing-law jurisdiction (Republic of Ghana) and dispute-resolution venue.

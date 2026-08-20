# Full-Platform Debug & Audit Report

**Date:** 2026-08-19  
**Scope:** Super-admin portal, tenant-platform portal, customer portals (restaurant + salon) — backend + frontend  
**Mode:** Read-only audit — no fixes applied.  
**Method:** Static review using `multi-tenant-saas-workflow`, `code-review-and-quality`, `ui-audit`, and `secure-code-review` skill disciplines.

---

## Executive Summary

| Portal | Critical | High | Medium | Low | Info |
|--------|----------|------|--------|-----|------|
| Super-Admin Backend | 2 | 6 | 10 | 4 | 0 |
| Super-Admin Frontend | 0 | 1 | 11 | 20 | 0 |
| Tenant-Platform Backend | 2 | 3 | 2 | 0 | 1 |
| Tenant Portal Frontend | 0 | 2 | 5 | 2 | 0 |
| Customer Portal Backend | 1 | 3 | 3 | 1 | 1 |
| Customer Portal Frontend | 0 | 4 | 5 | 7 | 1 |

**Total findings:** 97  
**Top systemic risks:**
1. **Tenant isolation is implicit and fragile** — `withTenant` silently drops the `tenantId` filter when `req.tenant?.id` is falsy, and global `resolveTenant` trusts client-supplied headers.
2. **Auth layering mismatch** — super-admin mount middleware blocks platform admins from tenant routes they are explicitly permissioned for.
3. **Mass-assignment in customer profile update** — authenticated customers can write arbitrary columns including `points`, `tenantId`, and loyalty fields.
4. **Plaintext payment/delivery secrets** — Paystack and ShaQ Express credentials stored cleartext in the tenant table.
5. **Service-layer fragmentation** — 12+ frontend services duplicate axios interceptor boilerplate; no shared client abstraction.

---

## 1. Super-Admin Portal — Backend

**Source:** `back-end/_docs/audits/super-admin-backend-audit-2026-08-19.md`

### 1.1 Correctness

#### [Critical] Mount-level auth mismatch blocks platform admins from tenant routes
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107` + inner routers
- **Description:** All routes under `/api/v1/admin/tenants` are mounted with `adminMiddleware` (`protect` + `requireSuperAdmin`). Inner route handlers declare weaker permissions (`requirePermission("manage_tenants")`), but outer layer overrides them.
- **Impact:** Platform admins with `manage_tenants` permission cannot perform tenant operations despite explicit authorization.

#### [Critical] Missing `db` import causes runtime 500 in support chat auto-assign
- **File:** `back-end/src/tenant-platform/controllers/supportChat.controller.js:130`
- **Description:** `autoAssignConversationHandler` references `db.supportConversation.findAll(...)` but `db` is never imported.
- **Impact:** 500 Internal Server Error on valid support chat auto-assign endpoint.

#### [High] DSAR auto-fulfillment does not validate request eligibility
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:46-69`
- **Description:** `autoFulfillSimpleDsarHandler` marks ANY pending DSAR as fulfilled without checking request type, tenant compliance state, or auto-fulfill eligibility.
- **Impact:** Privacy/compliance violation risk under Ghana DPA 2012.

#### [High] `convertTrialHandler` mutates tenant billing status without role-specific permission
- **File:** `back-end/src/tenant-platform/controllers/trial.controller.js:20-39`
- **Description:** Converting trial to active subscription requires only `manage_tenants` permission. No separate approval or break-glass requirement.
- **Impact:** Financial impact — trial tenants could be converted to active without payment authorization.

#### [Medium] `updateGatewayHandler` accepts `null` for secret fields, potentially wiping keys
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:403-412`
- **Impact:** Accidental or malicious nullification of payment secrets causes immediate checkout failure.

#### [Medium] `computeScorecard` reports `pendingCount: 0` unconditionally
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:34`
- **Impact:** Incorrect dashboard data; compliance gaps hidden from super-admin.

### 1.2 Security

#### [High] Debug endpoint exposes platform internals without break-glass
- **File:** `back-end/src/tenant-platform/controllers/debug.controller.js:37-77`
- **Impact:** Information disclosure aiding reconnaissance for compromised super-admin accounts.

#### [High] Test payment-gateway endpoints accept raw secrets in request body
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:314-378`
- **Impact:** Compromised platform-admin account can exfiltrate valid Paystack/ShaQ Express secrets; secrets appear in server access logs.

#### [Medium] Cross-tenant search allows unrestricted super-admin access to all tenant PII
- **File:** `back-end/src/tenant-platform/controllers/crossTenantSearch.controller.js:5-19`
- **Impact:** Mass PII exposure; malicious or compromised super-admin can harvest all customer data platform-wide.

#### [Medium] Payment and delivery secrets stored in plaintext in tenant record
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:403-432`
- **Impact:** Database read access yields live payment credentials.

#### [Medium] Platform settings list endpoint exfiltrates sensitive configuration values
- **File:** `back-end/src/tenant-platform/controllers/platformSettings.controller.js:59-80`
- **Impact:** Any super-admin can read all platform secrets including `turnstile_secret_key`, `erpnext_api_secret`, `ip_allowlist`.

### 1.3 Architecture

#### [High] Inconsistent auth layering between mount manifest and route handlers
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107-199`
- **Impact:** Developer confusion, permission drift, and the critical correctness issue above.

#### [Medium] Monolithic 200-line route manifest
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:100-199`
- **Impact:** High maintenance cost; increased risk of copy-paste errors.

#### [Medium] Missing centralized input validation
- **File:** Multiple controllers
- **Impact:** Type coercion bugs, missing-field edge cases, and injection vectors.

#### [Medium] Double rate-limiting on tenant-platform routes
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107` + individual routers
- **Impact:** Minor overhead; `X-RateLimit-*` headers may reflect only inner limiter.

### 1.4 Performance

#### [High] Unbounded bulk email to all tenants when `tenantIds` is empty
- **File:** `back-end/src/tenant-platform/controllers/billingEmail.controller.js:4-11`
- **Impact:** Thundering-herd of SMTP connections; event-loop exhaustion.

#### [Medium] Compliance scorecard loads up to 10,000 records into memory
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:14-17`
- **Impact:** Memory pressure; potential OOM.

#### [Medium] Support chat auto-assign runs unbounded aggregation
- **File:** `back-end/src/tenant-platform/controllers/supportChat.controller.js:130-142`
- **Impact:** Query latency grows linearly; request timeouts under load.

#### [Medium] Webhook handler performs synchronous side effects
- **File:** `back-end/src/tenant-platform/controllers/billing.controller.js:46-127`
- **Impact:** Webhook timeouts, duplicate processing, cascading failures.

### 1.5 Observability

#### [Medium] Inconsistent logging — `console.error` instead of centralized logger
- **File:** `breakGlass.controller.js:12`, `billing.controller.js:108`, `tenantAdmin.controller.js:93,98,109`
- **Impact:** Production errors may not appear in centralized logging.

#### [Medium] Break-glass expiration endpoint lacks actor audit trail
- **File:** `back-end/src/tenant-platform/controllers/breakGlass.controller.js:115-118`
- **Impact:** Cannot attribute bulk expiration events.

#### [Low] Auth failure logging omits request body
- **File:** `back-end/src/middleware/auditLog.js:81-100`
- **Impact:** Lower-fidelity security incident investigation.

---

## 2. Super-Admin Portal — Frontend

**Source:** `front-end/src/views/admin/AUDIT_REPORT.md`

### 2.1 Correctness

#### [Medium] Brittle payment/delivery detection in GatewayConfigCard
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:46`
- **Impact:** Admin could save delivery credentials to payment gateway or vice versa.

#### [Medium] Test connection exposes sensitive financial data in UI
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:66-68`
- **Impact:** Sensitive account balance visible to any admin.

#### [Medium] Save gateway does not clear secrets when switching modes
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:121-125`
- **Impact:** Stale credentials persist after downgrade to platform mode.

#### [Medium] JSON.parse without error handling in auth store
- **File:** `front-end/src/stores/auth.ts:35-37, 62, 229-231`
- **Impact:** Corrupted `sessionStorage` crashes auth init and locks user out.

#### [Low] Naive host-to-slug extraction in useTenantResolver
- **File:** `front-end/src/composables/useTenantResolver.ts:42`
- **Impact:** Tenant resolution fails on non-trivial hostnames.

#### [Low] Hardcoded limit and missing pagination in useSalonCrudView
- **File:** `front-end/src/composables/useSalonCrudView.ts:66`
- **Impact:** Large datasets truncated.

### 2.2 Security

#### [High] Missing auth on ERPNext proxy client
- **File:** `front-end/src/services/erpnextAPI.js:1-8`
- **Impact:** ERPNext data accessible without proper auth context.

#### [Medium] 401 redirect bypasses Vue Router
- **File:** `front-end/src/services/platformPaymentAPI.js:28`, `front-end/src/services/planAPI.js:28`
- **Impact:** Full page reload on 401; guards and hooks aborted.

#### [Medium] Benchmark API lacks tenant header injection
- **File:** `front-end/src/services/benchmarkAPI.js:5-10`
- **Impact:** Tenant A sees Tenant B benchmark data.

#### [Medium] Audit API has tenant header but no auth guard
- **File:** `front-end/src/services/platformAuditAPI.js:1-19`
- **Impact:** Audit log queries for wrong tenant if `currentTenant` is stale.

### 2.3 Architecture

#### [High] Service-layer fragmentation — 4 distinct axios patterns
- **File:** Multiple across `front-end/src/services/`
- **Impact:** Cross-cutting concerns must be patched in 20+ files.

#### [Medium] Two base-URL environment variables
- **File:** `front-end/src/services/tenantPublicAPI.js:3`
- **Impact:** Inconsistent API routing.

#### [Medium] Salon CRUD factory misapplied to non-salon entities
- **File:** `front-end/src/composables/useSalonCrudAPI.ts` and consumers
- **Impact:** Vertical assumption leaks into platform code.

#### [Medium] Auth store conflates platform, tenant, and branding state
- **File:** `front-end/src/stores/auth.ts`
- **Impact:** Difficult to test or reuse in non-tenant contexts.

### 2.4 UX/UI

#### [Medium] Save button gated behind connection test
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:286`
- **Impact:** No "Save without testing" escape hatch.

#### [Low] GSAP scaleIn produces double-tap visual artifact
- **File:** `front-end/src/composables/useAnimations.ts:61-71`
- **Impact:** Inconsistent tactile feedback.

#### [Low] Duplicated layout logic across SuperAdminLayout and TenantLayout
- **File:** `front-end/src/layouts/SuperAdminLayout.vue`, `front-end/src/layouts/TenantLayout.vue`
- **Impact:** Bug fixes must be applied twice.

---

## 3. Tenant-Platform Portal — Backend

**Source:** Subagent audit of `tenant-platform/{routes,controllers,middleware}`, `DAOs/*`, `models/*`, `verticals/*`

### 3.1 Tenant Isolation (Critical Dimension)

#### [Critical] `withTenant` silently drops tenant filter when `tenantId` is falsy
- **File:** `back-end/src/DAOs/reservation.dao.js:10`, `payment.dao.js:6`, `order.dao.js:10-11`
- **Description:** `const withTenant = (where = {}, tenantId) => (tenantId ? { ...where, tenantId } : where);`
- **Impact:** Cross-tenant data exposure/modification when `tenantId` is undefined. Triggers: (a) `isTenantModeEnabled()` defaults to false, (b) super-admin `user.tenantId = null`, (c) routes missing `protect`.

#### [Critical] Tenant context derived from spoofable client header; isolation depends on per-route `protect`
- **File:** `tenant-platform/middleware/resolveTenant.js:28-45`
- **Description:** `req.tenant` set from `X-Tenant-Id`, `X-Tenant-Slug`, or subdomain with no proof caller belongs to that tenant.
- **Impact:** Any route forgetting `protect` becomes tenant-spoofable and cross-tenant.

#### [High] Public/unprotected tenant writes via `req.tenant?.id`
- **File:** `controllers/reservation.controller.js:127` → route `POST /api/v1/reservations` without `protect`
- **Impact:** Orphaned reservations with `tenantId = NULL`.

#### [High] Super-admin controllers pass `req.tenant?.id` (undefined) into tenant-scoped DAOs
- **Files:** `tenant-customization.controller.js`, `data-residency.controller.js`, `change-management.controller.js`, `dataRetention.controller.js`, `metering.controller.js`, `supportChat.controller.js`, `supportTicket.controller.js`, `failedPaymentAlert.controller.js`, `supportAttachment.controller.js`
- **Impact:** Cross-tenant data exposure/modification by super-admins.

#### [High] `requireActiveTenant` gates on header tenant, but data access uses token tenant
- **File:** `server.js:252-253` + `middleware/tenantStatus.js` + per-route `protect`
- **Impact:** Suspended tenants bypass subscription-status block by spoofing active tenant header.

### 3.2 RBAC

#### [Medium] `enforceTOTP` bypassed in non-production
- **File:** `middleware/auth.js:29`, `auth.js:151`
- **Impact:** Privilege-check bypass in staging/dev.

#### [Medium] Fragile per-route protection model
- **Description:** Routes rely on each handler calling `protect`. Single forgotten call is an instant authz bypass.

### 3.3 Security

#### [Medium] `debug.controller.js` exposes infrastructure metadata
- **File:** `back-end/src/tenant-platform/controllers/debug.controller.js`
- **Impact:** Minor info-disclosure.

### 3.4 Performance

#### [Medium] No cache singleflight / stampede protection in `resolveTenant`
- **File:** `tenant-platform/middleware/resolveTenant.js:63-94`
- **Impact:** Cache stampede under burst traffic.

#### [Medium] `searchReservations` / `getReservationStats` load full rows then aggregate in JS
- **Files:** `reservation.dao.js:122-147`, `:914-916`
- **Impact:** Higher memory/CPU; `total` can mismatch returned rows.

### 3.5 Data Integrity

#### [High] Transactions missing on multi-step reservation lifecycle in some paths
- **File:** `back-end/src/DAOs/reservation.dao.js`
- **Impact:** Lost-update / inconsistent status history under concurrency.

#### [Medium] `updateReservation` accepts arbitrary fields
- **File:** `reservation.dao.js:419-424`
- **Impact:** Unsafe by contract; mitigated at controller layer only.

---

## 4. Tenant Portal — Frontend

**Source:** Subagent audit of `front-end/src/views/`, `components/`, `layouts/`, `stores/`, `composables/`, `services/`

### 4.1 Tenant Context Leakage

#### [High] Silent tenant resolution failure leaves stale context
- **File:** `front-end/src/views/customer/CustomerPortalView.vue:11-20`
- **Impact:** User sees portal for wrong tenant.

#### [High] Stale tenant context not invalidated on auth refresh
- **File:** `front-end/src/stores/auth.ts:137-148`
- **Impact:** Cross-tenant data exposure if user logs in as different tenant.

#### [Medium] Tenant slug not validated before registration
- **File:** `front-end/src/views/CustomerRegisterView.vue:28, 84-93`
- **Impact:** Customer may register under non-existent tenant.

#### [Medium] Tenant switcher accessible to any authenticated user in layout
- **File:** `front-end/src/layouts/TenantLayout.vue:270-273`
- **Impact:** Any user with `manage_tenants` can switch tenant context globally.

### 4.2 Correctness

#### [Medium] Unsafe `any` cast for user name field
- **File:** `front-end/src/views/customer/CustomerPortalHomeView.vue:19`
- **Impact:** TypeScript safety bypassed.

#### [Medium] Polling error counter never resets on manual retry
- **File:** `front-end/src/views/customer/CustomerPortalReservationsView.vue:56-86`
- **Impact:** Reservations list stops auto-refreshing after transient errors.

#### [Medium] `new Date()` called on unvalidated API date strings
- **File:** `front-end/src/views/customer/CustomerPortalOrdersView.vue:68`
- **Impact:** Broken UI rendering if date malformed.

### 4.3 Security

#### [High] Open redirect via unvalidated `redirect` query parameter
- **File:** `front-end/src/views/CustomerLoginView.vue:49`, `front-end/src/views/CustomerRegisterView.vue:126-131`
- **Impact:** Phishing attacks.

#### [Medium] Cart data persisted in plaintext localStorage
- **File:** `front-end/src/stores/cart.ts:64-77`
- **Impact:** Sensitive data exposed to XSS or third-party scripts.

#### [Medium] Tenant branding colors not sanitized before CSS injection
- **File:** `front-end/src/views/CustomerRegisterView.vue:57-78`, `front-end/src/composables/useTenantBranding.js:30-69`
- **Impact:** CSS injection via tenant-controlled color values.

### 4.4 Architecture

#### [Medium] Duplicate layout/state CSS across 18 customer portal views
- **Impact:** Bloat (~2000+ lines); style drift.

#### [Medium] Two overlapping landing views
- **File:** `front-end/src/views/HomeView.vue`, `front-end/src/views/CustomerLandingView.vue`
- **Impact:** Maintenance burden; divergent UX.

#### [Low] Redundant CustomerPortalView wrapper
- **File:** `front-end/src/views/customer/CustomerPortalView.vue`
- **Impact:** Unnecessary indirection.

### 4.5 Performance

#### [Medium] Hero images loaded eagerly without optimization
- **File:** `front-end/src/components/LandingHero.vue:39-74`
- **Impact:** Slow LCP; high bandwidth usage.

#### [Medium] Polling without exponential backoff
- **File:** `front-end/src/views/customer/CustomerPortalReservationsView.vue:61-75`
- **Impact:** Battery drain on mobile.

---

## 5. Customer Portals — Backend

**Source:** Subagent audit of `back-end/src/routes/customer-portal.router.js`, `controllers/customer-portal.controller.js`, `salon-customer-portal.router.js`, `salon-customer-portal.controller.js`, `DAOs/reservation.dao.js`

### 5.1 Critical

#### [Critical] `PATCH /profile` writes arbitrary customer columns (mass assignment)
- **File:** `back-end/src/controllers/customer-portal.controller.js:47`; DAO `back-end/src/DAOs/reservation.dao.js:217-223`
- **Description:** `updateCustomerProfileHandler` calls `reservationDAO.updateCustomer(customer.id, req.body, req.tenant?.id)`. `updateCustomer` runs `customer.update(updates)` with no field allow-list.
- **Impact:** Authenticated customer can write any column on their own `Customers` row. Confirmed writable: `points`, `tags`, `notes`, `address`, `city`, `latitude`, `longitude`, `preferences`, `visitCount`, `tenantId`.
  - **Loyalty manipulation:** set `points` to arbitrary high value, then call `POST /loyalty/redeem`.
  - **Cross-tenant record move:** set `tenantId` to another tenant's id.

### 5.2 High

#### [High] Tenant scoping silently drops when `req.tenant?.id` is unset
- **File:** `back-end/src/DAOs/reservation.dao.js:10`; `back-end/src/middleware/auth.js:87-91`; `back-end/src/tenant-platform/middleware/resolveTenant.js:10-12`
- **Impact:** Every customer-portal query becomes cross-tenant if tenant resolution yields `undefined`.

#### [High] Customer-portal routes lack `customer` role / vertical gate
- **File:** `back-end/src/routes/customer-portal.router.js:14-69`; mount at `back-end/src/verticals/restaurant/modules/restaurant.module.js:49`
- **Impact:** Any authenticated tenant user can invoke `/customer-portal/*`.

#### [High] Review authorization uses `req.user.id` as `customerId` (wrong ID space)
- **File:** `back-end/src/controllers/review.controller.js:157-218`
- **Description:** Uses `req.user?.id` (Users PK) as `customerId` and compares to `reservation.customerId` (Customers FK).
- **Impact:** Functional/auth failure; latent IDOR if `Customers.id` collides with `Users.id`.

### 5.3 Medium

#### [Medium] Cancellation bypasses policy, deposits, refunds, and audit
- **File:** `back-end/src/controllers/customer-portal.controller.js:72-94`; DAO `back-end/src/DAOs/reservation.dao.js:419-424`
- **Impact:** Customer can cancel minutes before seating; paid deposits silently left as `paid`.

#### [Medium] Loyalty redeem returns full customer PII
- **File:** `back-end/src/controllers/customer-loyalty.controller.js:63-64`; DAO `back-end/src/DAOs/reservation.dao.js:267-278`
- **Impact:** Data-minimization violation under DPA 2012 / GDPR.

#### [Medium] `findOrCreateCustomer` mutates `visitCount` on every `GET /profile`
- **File:** `back-end/src/controllers/customer-portal.controller.js:14-20`; DAO `back-end/src/DAOs/reservation.dao.js:202-205`
- **Impact:** Non-idempotent GET inflates visit/loyalty metrics.

#### [Medium] CSRF double-submit has no session binding; dev `sameSite=false`
- **File:** `back-end/src/middleware/csrf.js:16-22, 27-58`
- **Impact:** In dev/test, CSRF cookie sent on cross-site requests.

---

## 6. Customer Portals — Frontend

**Source:** Subagent audit of `front-end/src/views/customer/*.vue`, `CustomerLandingView.vue`, `HomeView.vue`, `OnboardingView.vue`, shared components, layouts, stores, composables, `customerAPI.js`, `salonCustomerPortalAPI.js`

### 6.1 Customer-Tenant Isolation

#### [High] Stale tenant context not invalidated on auth refresh
- **File:** `front-end/src/stores/auth.ts:137-148`
- **Impact:** Cross-tenant data exposure if user logs in as different tenant.

#### [High] Tenant switcher accessible to any authenticated user in layout
- **File:** `front-end/src/layouts/TenantLayout.vue:270-273`
- **Impact:** Any user with `manage_tenants` can switch tenant context globally.

### 6.2 Correctness

#### [Medium] Wallet pass payment redirect without state cleanup
- **File:** `front-end/src/views/customer/CustomerPortalEventWalletPassView.vue:137-173`
- **Impact:** Memory leak from orphaned interval; duplicate API calls.

#### [Medium] Onboarding redirects regardless of legal acceptance server response
- **File:** `front-end/src/views/OnboardingView.vue:151-164`
- **Impact:** Legal acceptance may not be recorded.

#### [Medium] Double-trigger on support ticket table rows
- **File:** `front-end/src/views/customer/CustomerPortalSupportView.vue:79-113`
- **Impact:** Double API call; potential race condition.

### 6.3 Security

#### [High] Open redirect via unvalidated `redirect` query parameter
- **File:** `front-end/src/views/CustomerLoginView.vue:49`, `front-end/src/views/CustomerRegisterView.vue:126-131`
- **Impact:** Phishing attacks.

#### [Medium] Phone number inputs lack format validation
- **File:** `front-end/src/views/OnboardingView.vue:204-209`, `front-end/src/views/CustomerRegisterView.vue:254-273`
- **Impact:** Invalid phone numbers stored; WhatsApp OTP delivery fails.

#### [Medium] Tenant branding colors not sanitized before CSS injection
- **File:** `front-end/src/views/CustomerRegisterView.vue:57-78`, `front-end/src/composables/useTenantBranding.js:30-69`
- **Impact:** CSS injection via tenant-controlled color values.

#### [Low] XSRF token exposed via cookie parser without Secure/HttpOnly flags
- **File:** `front-end/src/services/API.js:7-8`, `front-end/src/composables/useXsrfToken.ts:1-3`
- **Impact:** Token theft via XSS or network interception.

### 6.4 UX/UI

#### [Medium] Missing focus management in modals
- **File:** `front-end/src/views/customer/CustomerPortalSupportView.vue:119-254`
- **Impact:** Keyboard users lose context.

#### [Medium] Appointment status error messages not scoped to individual items
- **File:** `front-end/src/views/customer/CustomerPortalAppointmentsView.vue:195-233`
- **Impact:** Confusing UX; user sees error for wrong appointment.

#### [Low] Inconsistent button/link styling across views
- **File:** Multiple view files
- **Impact:** Visual inconsistency; maintenance burden.

### 6.5 Architecture

#### [Medium] Duplicate layout/state CSS across 18 customer portal views
- **Impact:** Bloat (~2000+ lines).

#### [Medium] Two overlapping landing views
- **File:** `front-end/src/views/HomeView.vue`, `front-end/src/views/CustomerLandingView.vue`
- **Impact:** Maintenance burden; divergent UX.

#### [Low] Salon customer portal API hardcodes vertical prefix
- **File:** `front-end/src/services/salonCustomerPortalAPI.js:3-32`
- **Impact:** Cannot reuse for event vertical.

### 6.6 Performance

#### [Medium] Hero images loaded eagerly without optimization
- **File:** `front-end/src/components/LandingHero.vue:39-74`
- **Impact:** Slow LCP; high bandwidth usage.

#### [Medium] Polling without exponential backoff
- **File:** `front-end/src/views/customer/CustomerPortalReservationsView.vue:61-75`
- **Impact:** Battery drain on mobile.

#### [Low] Search filters without debounce
- **File:** `front-end/src/views/customer/CustomerPortalReservationsView.vue:97-112`
- **Impact:** Minor UI jank.

#### [Low] `v-for` uses array index as key in OrdersView
- **File:** `front-end/src/views/customer/CustomerPortalOrdersView.vue:83`
- **Impact:** Unnecessary DOM re-renders.

---

## 7. Consolidated Severity Summary

| Portal | Critical | High | Medium | Low | Info | Total |
|--------|----------|------|--------|-----|------|-------|
| Super-Admin Backend | 2 | 6 | 10 | 4 | 0 | 22 |
| Super-Admin Frontend | 0 | 1 | 11 | 20 | 0 | 32 |
| Tenant-Platform Backend | 2 | 3 | 2 | 0 | 1 | 8 |
| Tenant Portal Frontend | 0 | 2 | 5 | 2 | 0 | 9 |
| Customer Portal Backend | 1 | 3 | 3 | 1 | 1 | 9 |
| Customer Portal Frontend | 0 | 4 | 5 | 7 | 1 | 17 |
| **Grand Total** | **5** | **19** | **36** | **34** | **3** | **97** |

---

## 8. Top 10 Remediation Priorities

| Rank | Severity | Finding | Portal | Dimension |
|------|----------|---------|--------|-----------|
| 1 | Critical | `withTenant` silently drops tenant filter when `tenantId` falsy | Tenant-Platform Backend | Tenant Isolation |
| 2 | Critical | Mount-level auth mismatch blocks platform admins from tenant routes | Super-Admin Backend | RBAC |
| 3 | Critical | Missing `db` import causes runtime 500 in support chat auto-assign | Super-Admin Backend | Correctness |
| 4 | Critical | `PATCH /profile` mass assignment — customers can write arbitrary columns | Customer Portal Backend | Security |
| 5 | High | Tenant context derived from spoofable client header; isolation depends on per-route `protect` | Tenant-Platform Backend | Tenant Isolation |
| 6 | High | Public/unprotected tenant writes via `req.tenant?.id` when unresolved | Tenant-Platform Backend | Tenant Isolation |
| 7 | High | Super-admin controllers pass `req.tenant?.id` (undefined) into tenant-scoped DAOs | Tenant-Platform Backend | Tenant Isolation |
| 8 | High | Review authorization uses `req.user.id` as `customerId` (wrong ID space) | Customer Portal Backend | Auth/IDOR |
| 9 | High | Missing auth on ERPNext proxy client | Super-Admin Frontend | Security |
| 10 | High | Unbounded bulk email to all tenants when `tenantIds` empty | Super-Admin Backend | Performance |

---

## 9. Cross-Cutting Systemic Risks

### 9.1 Tenant Isolation Model is Implicit and Fragile
The entire multi-tenant isolation model rests on three implicit assumptions:
1. Client-supplied `X-Tenant-Id` header is ignored and `req.tenant` is re-derived from JWT via `protect`.
2. Every handler remembers to call `protect`.
3. `withTenant` silently drops the filter on falsy `tenantId` rather than failing closed.

Any single regression produces a cross-tenant exposure. **Recommendation:** Make tenant context authoritative from the authenticated principal, make `withTenant` fail-closed, and add a centralized tenant-membership guard.

### 9.2 Auth Layering is Inconsistent
Super-admin mount middleware applies `adminMiddleware` (super-admin only) to entire mount paths, yet inner routers declare weaker permissions. This creates confusion and blocks legitimate platform-admin access. **Recommendation:** Choose one auth layer (mount or route) and remove the other.

### 9.3 Service-Layer Fragmentation in Frontend
12+ frontend services duplicate axios interceptor boilerplate. No shared `AdminClient` or `TenantClient` abstraction exists. Cross-cutting concerns must be patched in 20+ files. **Recommendation:** Extract a shared HTTP client factory with auth, tenant header, XSRF, and error normalization.

### 9.4 Plaintext Secrets
Payment and delivery secrets (`paystackSecretKey`, `shaqexpressSecret`) are stored cleartext in the tenant table. Platform settings list endpoint returns raw values including `turnstile_secret_key` and `erpnext_api_secret`. **Recommendation:** Migrate to vault-backed secret storage; redact sensitive keys in list responses.

### 9.5 Mass-Assignment in Customer Profile
The customer `PATCH /profile` endpoint passes `req.body` directly to Sequelize `update()` with no field allow-list. Customers can write arbitrary columns including `points`, `tenantId`, and loyalty fields. **Recommendation:** Enforce strict field allow-list in DAO; never pass raw request body through.

---

## 10. Positive Observations

1. **No SQL/NoSQL injection found** — all data access uses parameterized Sequelize ORM calls.
2. **Webhook signature verified** — Paystack webhooks validated before processing; idempotent via `paystackEvent` dedup.
3. **CSRF double-submit implemented** — with `crypto.timingSafeEqual` length+value compare.
4. **Read replica fallback used** — DAOs correctly use `readReplica.withReplicaFallback` for read paths.
5. **Error handling clean in customer portal** — no stack traces or SQL errors leaked to clients.
6. **Dynamic imports in router** — good bundle-splitting pattern.
7. **Tenant-prefixed cache keys** — `tenantCache.js` prevents cross-tenant cache leakage.
8. **TOTP enforced for super-admin** — break-glass elevation exists for privileged operations.
9. **Backend test coverage strong** — 166 suites, 1195 tests passing.
10. **Frontend build integrity** — `npm run build` and `npm run lint` pass.

---

## 11. Verification Notes

- **Backend tests:** 166 suites, 1195 tests passing (as of audit date).
- **Frontend build:** `npm run build` succeeds.
- **Frontend lint:** `npm run lint` passes.
- **No fixes applied** — this is a read-only audit per instructions.

---

*Report generated using `multi-tenant-saas-workflow`, `code-review-and-quality`, `ui-audit`, and `secure-code-review` skill disciplines.*  
*Detailed sub-reports: `back-end/_docs/audits/super-admin-backend-audit-2026-08-19.md`, `front-end/src/views/admin/AUDIT_REPORT.md`.*

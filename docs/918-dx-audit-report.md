# DX Audit Report — Multi-Tenant Tenant-Platform API

**Date:** 2026-08-12
**Scope:** Frontend API services, backend controllers/routes, onboarding DX
**Method:** Source code review of `front-end/src/services/` (81 files),
`back-end/src/tenant-platform/` (82 controllers, 82 routes, 49 DAOs)
**Workflow Phase:** Multi-Tenant SaaS Workflow — Phase 7 (Operate & Iterate: Developer Experience)

---

## 1. API Layer Consistency

### 1.1 Base API Service (`front-end/src/services/API.js`)

| Check | Grade | Notes |
|-------|-------|-------|
| Axios instance with baseURL | A | `/api/v1` base, env override via `VITE_API_URL` ✅ |
| 401 token refresh interceptor | A | Queue management prevents duplicate refresh calls ✅ |
| Error propagation | B | All errors rejected via `Promise.reject` — but no structured error context for debugging ❌ |
| Request headers | A | Auth token + CSRF token injected via interceptor ✅ |
| **Timeout config** | **F** | **No `timeout` set on the shared `API.js` instance** — requests can hang indefinitely ❌ |
| Error context enrichment | F | No `validateStatus`, no `error.code` normalization, no retry policy ❌ |

**Finding 1 (P0):** No timeout configured on the base Axios instance (`API.js:4`).
A slow or dead backend causes indefinite hangs with no user feedback. The
`onboardingAPI.js` and `benchmarkAPI.js` services create their own axios
instances, so a fix to `API.js` does not cover them.
Fix: add `timeout: 15000` to `API.js`; audit custom instances.

**Finding 1b (P1):** Frontend API services (81 files) lack JSDoc — only
`benchmarkAPI.js` (1 of 81) contains a `@param` annotation. New developers
must read backend controllers to discover response shapes.
Fix: add a JSDoc template + ESLint rule (`require-jsdoc` for exported service
methods) and backfill across `tenantAdminAPI.js` first.

### 1.2 Admin API Services (`front-end/src/services/adminAPI.js`, `tenantAdminAPI.js`)

| Check | Grade | Notes |
|-------|-------|-------|
| Consistent REST patterns | A | GET/POST/PATCH/DELETE mapped correctly per resource ✅ |
| Parameterized routes | A | `${id}` interpolation used consistently ✅ |
| Pagination support | B | `getAll` accepts `{ page, pageSize, search }` but not all services follow this — some only accept raw params ❌ |
| Bulk operations | C | `bulkChangeVertical` exists but uses a different endpoint pattern than CRUD (`/bulk/change-vertical`) ❌ |
| Export/anonymize | B | `exportData` vs `anonymizeData` — no consistent verb for destructive ops ❌ |
| Error handling | C | All services return the raw axios promise — no try/catch wrapper or normalized error shape ❌ |
| Return value docs | F | No JSDoc on any service method — developers must read the backend controller to know return shape ❌ (1/81 have it) |
| Custom axios instances | C | `onboardingAPI.js` and `benchmarkAPI.js` create their own clients instead of reusing `API.js`, so the 401 interceptor and CSRF headers are NOT applied ❌ |

**Finding 2 (P1):** 81 frontend service files lack JSDoc (only
`benchmarkAPI.js:12-14` has one). New developers cannot know response
shapes without cross-referencing backend controllers. Fix: add a JSDoc
template and lint rule for new services.

**Finding 3 (P0):** No centralized error handling in views. Services throw to
the component, and each view handles errors differently (or not at all). Fix:
create a `useApiError` composable that normalizes error shapes and provides
toast notifications.

**Finding 3b (P1):** Two service files (`onboardingAPI.js`, `benchmarkAPI.js`)
create isolated axios instances that bypass the `API.js` interceptor chain.
This means token-refresh and `X-Tenant-Id` header injection do not apply to
onboarding or benchmark calls. Fix: consolidate into `API.js` with a base-path
override parameter.

### 1.3 Onboarding API (`front-end/src/services/onboardingAPI.js`)

| Check | Grade | Notes |
|-------|-------|-------|
| Endpoint clarity | A | `/admin/tenants/{id}/onboarding` — RESTful ✅ |
| Method coverage | B | `getOnboarding`, `updateOnboarding`, `completeOnboarding` — missing `resetOnboarding` ❌ |
| Step validation | F | No client-side validation of onboarding steps before calling API ❌ |
| Progress tracking | B | `getOnboarding` returns steps, but no progress percentage helper ❌ |
| Uses base interceptor | C | Creates its own axios instance — bypasses 401 interceptor ❌ (see 1.2) |

**Finding 4 (P1):** Missing `resetOnboarding` API endpoint. When a tenant
setup is abandoned mid-way, there's no clean way to restart from scratch
without backend intervention.

---

## 2. Backend Controller DX

### 2.1 Structure (`back-end/src/tenant-platform/`)

| Check | Grade | Notes |
|-------|-------|-------|
| Controller count | A | 82 controllers, each mapped 1:1 to a route file ✅ |
| Module registration | A | Single `tenant-platform.module.js` registers all routes with middleware ✅ |
| Middleware chain | A | Every route uses `[logAction, validateCsrfToken, adminMiddleware]` consistently ✅ (public routes omit adminMiddleware) ✅ |
| Error handling | B | Controllers use `try/catch` but error messages are not standardized ❌ |
| Input validation | F | No consistent input validation library across controllers — inline checks vary ❌ |
| Response format | B | **All** controllers use `{ success, ... }` envelope, but the data key varies: `item` (101), `collection` (68), `data` (2), or bare (26 message-only) ❌ |

**Finding 5 (P1 — refined):** Controllers consistently wrap responses in
`{ success: true/false, ... }` (confirmed: 245 success responses, 246
failure responses across all 82 controller files — zero bare `res.json()`
calls without `success`). However, the **payload envelope key is
inconsistent**: `item` (single resource, 101), `collection` (list, 68),
`data` (2), or none (message-only, 26). Additionally, 5 special-case keys
(`featureFlags`, `total`, `module`, `setting`, `tenantGraceDays`, etc.)
appear. Fix: standardize on `{ success, data, meta, message }` with `data`
always holding the primary payload regardless of cardinality.

### 2.2 DAO Layer

| Check | Grade | Notes |
|-------|-------|-------|
| Method naming | F | `findAll` + `list` coexist in ~18 DAOs; `getAll` in `usage.dao.js`; `remove` vs `delete` ❌ |
| Pagination | C | Mixed `{ limit, offset }` and `{ page, pageSize }` conventions across files ❌ |
| Soft deletes | F | No DAO supports soft deletes — all use hard `destroy()`; `tenantAdmin.dao.js` is the only file referencing `deletedAt`/`paranoid` ❌ |
| Error handling | C | DAOs don't catch DB errors — they propagate raw Sequelize errors ❌ |

**Finding 6 (P2):** DAO method naming inconsistency across 49 files.
Three naming families coexist:
- `findAll` — used in ~30 DAOs
- `list` — used in ~18 DAOs (functionally identical to `findAll`)
- `getAll` — used in `usage.dao.js` only

Additionally, `remove` (Sequelize convention) and `delete` (JavaScript
keyword) both appear for the same semantic operation. Fix: adopt a single
convention (`findMany`, `findOne`, `create`, `update`, `remove`) and audit
all DAOs.

**Finding 6b (P2):** No soft-delete support. Only `tenantAdmin.dao.js`
references `paranoid`/`deletedAt`. All other DAOs use hard
`Model.destroy()`, risking data-loss incidents for tenant support tickets,
notes, and audit records. Fix: enable `paranoid: true` on all tenant-data
models and standardize `deletedAt` handling in DAOs.

---

## 3. Onboarding Developer Experience

### 3.1 Frontend Routes

```
/onboarding                    → OnboardingWizard.vue
/admin/tenants/:id/onboarding  → (super-admin tenant detail tab)
/onboarding/wizard             → TenantSetupWizardView.vue (name: "tenant-setup-wizard")
```

> **Correction (from draft):** The third route is `/onboarding/wizard`,
not `/tenant-setup-wizard`. The component is `TenantSetupWizardView.vue`,
not `SetupWizard.vue`. The route is registered via `router.addRoute()` at
`router/index.js:1175` with `meta: { standalone: true, requiresAuth: true }`.

**Finding 7 (P1):** Three onboarding-related routes with overlapping
functionality. `/onboarding` and `/onboarding/wizard` appear to serve
similar purposes (initial tenant setup vs. multi-step wizard) but use
different components and route namespaces. Consolidation recommended.

### 3.2 Backend Onboarding Controller

```
GET    /:tenantId/onboarding             → getOnboardingHandler
PATCH  /:tenantId/onboarding             → updateOnboardingHandler
POST   /:tenantId/onboarding/complete     → completeOnboardingHandler
```

> **Correction (from draft):** The route base is `/api/v1/admin/tenants`, not
`/admin/tenants/{id}/onboarding`. The complete endpoint uses `POST`, not
`PATCH` as stated in the original draft.

**Finding 8 (P2):** The `/onboarding/complete` sub-resource is a state
transition rather than a REST sub-resource. Convention would be
`PATCH /:tenantId` with `{ onboardingComplete: true }` on the main resource.
This is a design inconsistency, not a bug — fix is low priority.

### 3.3 Auth Init Pattern

```js
// main.ts:56-69
async function bootstrap() {
  app.use(pinia);
  app.directive("hover-lift", vHoverLift);
  app.directive("tap-scale", vTapScale);
  const authStore = useAuthStore();
  await authStore.init();
  app.use(router);
  app.use(createVuestic(vuesticConfig));
  app.mount("#app");
}
```

The auth init pattern is **correctly implemented**: `await authStore.init()`
(line 63) executes before `app.use(router)` (line 65), so Vue Router
`beforeEach` guards execute after session state is resolved. The `init()`
method in `stores/auth.ts:203-224` calls `Promise.all([getMe(),
fetchTenantMode(), fetchCapabilities()])` with per-call `.catch()` guards.

**Finding 9 (P1):** No TypeScript types enforce the auth-init-before-router
contract at the call site. `main.ts` is `.ts` but the `bootstrap()` function
is untyped — a refactor could accidentally move `app.use(router)` before
`await authStore.init()`. Fix: extract into a typed `initAuth()` function
in `stores/auth.ts` with an explicit return contract, and add a lint rule
or comment guard.

### 3.4 Critical: Missing `createApp` Call (P0)

`front-end/src/main.ts:1` imports `createApp` from Vue and `front-end/src/main.ts:5`
imports `App` from `./App.vue`, but **the line `const app = createApp(App)` is never
present**. The `bootstrap()` function references `app` (lines 57, 59, 65, 66, 68)
which is undefined, causing a `ReferenceError: app is not defined` at runtime.

This is a boot-breaking bug that must be fixed before any deployment.

---

## 4. API Ergonomics Summary

| Metric | Count | Notes |
|--------|-------|-------|
| Frontend API service files | 81 | In `front-end/src/services/` (+ 8 admin sub-services) |
| Backend controllers | 82 | 1:1 with route files |
| Backend route files | 82 | 1:1 with controllers |
| Backend DAOs | 49 | |
| Services with JSDoc | 1 | `benchmarkAPI.js` only |
| Services with timeout | 0 | None of the 81 service files set a timeout |
| Services with centralized error handling | 0 | All return raw axios promises |
| Services bypassing `API.js` interceptor | 2 | `onboardingAPI.js`, `benchmarkAPI.js` create own instances |
| Controllers with non-standard envelope key | 5 | `featureFlags`, `total`, `module`, `setting`, `tenantGraceDays` (rest use `item`/`collection`/`data`) |
| Controllers with bare `res.json()` (no `success`) | 0 | All 82 controllers use `{ success, ... }` |
| DAOs with `list` + `findAll` coexistence | ~18 | Naming duplication |
| DAOs with soft-delete support | 1 | `tenantAdmin.dao.js` only |
| DAOs without soft-delete support | 48 | All use hard `destroy()` |

---

## 5. Multi-Tenant Considerations

### 5.1 Tenant Context Propagation

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Frontend | `X-Tenant-Id` header injected in `API.js:15` interceptor | PASS |
| Frontend | `onboardingAPI.js`, `benchmarkAPI.js` — **bypass** interceptor | FAIL |
| Backend | `resolveTenant.js` middleware | PASS |
| Backend | `tenantStatus.js` subscription gate | PASS |
| Backend | Per-tenant route scoping via `tenant-platform.module.js` | PASS |

**Finding 10 (P1):** The `X-Tenant-Id` header is injected centrally in
`API.js` but bypassed by two services that create standalone axios
instances. If these calls execute before the user selects a tenant
(onboarding wizard), the backend `resolveTenant` middleware will fall back
to header-less resolution, which may route to a default tenant. Fix:
consolidate all service clients onto the `API.js` instance.

### 5.2 Feature Flag Integration

The `whitelabelAPI.js` and `legalAcceptanceAPI.js` services interact with
per-tenant feature flags (`updateFeatureFlags` in `tenantAdminAPI.js:50`).
No formal feature-flag SDK integration audit was performed in this review.
See `docs/924-feature-flag-audit.md` for the dedicated assessment.

---

## Recommendations (Prioritized)

### P0 — Immediate (1-2h each)
1. **Fix missing `const app = createApp(App)`** in `main.ts:56` — boot-breaking bug
2. Add `timeout: 15000` to `API.js` axios instance
3. Create `useApiError` composable for normalized error handling across views

### P1 — Short-term (2-4h each)
4. Add JSDoc to all admin API services (start with `tenantAdminAPI.js`, `adminAPI.js`)
5. Standardize controller response envelope to `{ success, data, meta, message }`
6. Add `resetOnboarding` endpoint to onboarding controller
7. Consolidate duplicate onboarding routes into a single canonical path
8. Extract auth-init contract into a typed `initAuth()` function in `stores/auth.ts`
9. Merge `onboardingAPI.js` and `benchmarkAPI.js` onto the shared `API.js` instance

### P2 — Medium-term (4-8h each)
10. Audit and standardize DAO method naming (`findAll`/`list` → `findMany`)
11. Audit all DAOs for soft-delete support and enable `paranoid: true`
12. Add ESLint `require-jsdoc` rule for service method documentation
13. Replace inline input validation with a consistent validation library (e.g., `express-validator` or `zod`)
14. Refactor `/onboarding/complete` to a state transition on the main resource

---

## Cross-Reference: Multi-Tenant SaaS Workflow Phases

| Workflow Phase | Related Findings | Status |
|----------------|-----------------|--------|
| Phase 1 (Discovery) | Finding 7 (route overlap), Finding 4 (missing reset) | Open |
| Phase 3 (Implementation) | Finding 1 (timeout), Finding 9 (typed auth init) | Open |
| Phase 3a (Design System) | See `917-design-review-report.md` for frontend UI | Complete |
| Phase 4 (Quality Gates) | Finding 6 (DAO naming), Finding 6b (soft deletes) | Open |
| Phase 7 (Operate) | Findings 2-3, 5-6, 10 (service/controller/DAO DX) | Open |

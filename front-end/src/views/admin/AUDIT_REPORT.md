# Super-Admin Portal Frontend Audit Report

**Scope:** `front-end/src/views/admin/*.vue`, `front-end/src/components/admin/*.vue`, `front-end/src/layouts/*.vue`, `front-end/src/stores/*.ts`, `front-end/src/composables/*.ts`, `front-end/src/services/*.js`

**Date:** 2026-08-19

**Status:** Findings only — no fixes applied.

---

## 1. Correctness

### 1.1 Brittle payment/delivery detection in GatewayConfigCard
- **Severity:** Medium
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:46`
- **Description:** `isPayment` is computed via `props.title.includes("Payment")`. Any title change (copy edit, localization) silently flips form fields and API calls.
- **Impact:** Admin could save delivery credentials to payment gateway or vice versa with no validation error.
- **Evidence:** `const isPayment = computed(() => props.title.includes("Payment"));`

### 1.2 Test connection exposes sensitive financial data in UI
- **Severity:** Medium
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:66-68`
- **Description:** On successful Paystack test, the success message stringifies `res.data.data` (which contains currency balance) and displays it in the UI.
- **Impact:** Sensitive account balance visible to any admin viewing the screen; logged to console if toast system logs messages.
- **Evidence:** `message: \`Connected. Currency balance: ${JSON.stringify(res.data.data)}\``

### 1.3 Save gateway does not clear secrets when switching modes
- **Severity:** Medium
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:121-125`
- **Description:** When saving, the payload only includes `paystackSecretKey` / `shaqexpressSecret` if the ref is truthy. Switching from "own" to "platform" mode leaves the old secret on the backend because the save handler for "platform" mode emits only `paymentGateway: "platform"` without clearing secrets.
- **Impact:** Stale credentials persist after downgrade to platform mode.
- **Evidence:** `if (secretKey.value) payload.paystackSecretKey = secretKey.value;`

### 1.4 Naive host-to-slug extraction in useTenantResolver
- **Severity:** Low
- **File:** `front-end/src/composables/useTenantResolver.ts:42`
- **Description:** `resolveFromHost` extracts slug via `host.split(".")[0]`. This fails for `my-app.localhost`, `sub.domain.com`, `127.0.0.1`, and any multi-level custom domain.
- **Impact:** Tenant resolution fails silently on non-trivial hostnames; customer portal routing breaks.
- **Evidence:** `const slug = host.split(".")[0];`

### 1.5 Hardcoded limit and missing pagination in useSalonCrudView
- **Severity:** Medium
- **File:** `front-end/src/composables/useSalonCrudView.ts:66`
- **Description:** `load()` always passes `limit: 100` and ignores pagination params from the caller.
- **Impact:** Large datasets truncated or cause performance degradation; no way to page through results.
- **Evidence:** `const res = await executeApiCall(config.api, method, { limit: 100, ...params });`

### 1.6 ReplayDrafts aborts entire sync on first failure
- **Severity:** Medium
- **File:** `front-end/src/composables/useOfflineAppointments.ts:86-88`
- **Description:** `replayDrafts` returns immediately on first mutation failure, leaving remaining pending mutations unprocessed and status stuck at `sync-failed`.
- **Impact:** Data loss for subsequent drafts; no retry or dead-letter queue.
- **Evidence:** `setStatus("sync-failed"); return;`

### 1.7 Non-deterministic idempotency key fallback in paymentAPI
- **Severity:** Medium
- **File:** `front-end/src/services/paymentAPI.js:34-36`
- **Description:** `refundPayment` generates an idempotency key using `Date.now()` when none is provided. Retries within the same millisecond produce duplicate keys.
- **Impact:** Double-refund risk or 409 conflicts on legitimate retry.
- **Evidence:** `` `${reservationId}-${paymentId}-${Date.now()}` ``

### 1.8 JSON.parse without error handling in auth store
- **Severity:** Medium
- **File:** `front-end/src/stores/auth.ts:35-37`, `front-end/src/stores/auth.ts:62`, `front-end/src/stores/auth.ts:229-231`
- **Description:** `currentTenant` initializer, `applySetting`, and `init()` all call `JSON.parse` on stored data without try-catch.
- **Impact:** A single corrupted `sessionStorage` entry crashes the entire auth init and locks the user out.
- **Evidence:** `const parsed = stored ? JSON.parse(stored) : null;` and `const v = typeof s.value === "string" ? JSON.parse(s.value) : s.value;`

### 1.9 JSON.parse without error handling in cart store
- **Severity:** Low
- **File:** `front-end/src/stores/cart.ts:68`
- **Description:** `loadFromStorage` calls `JSON.parse(raw)` inside a try-catch, but the catch silently sets `items.value = []`, discarding potentially valid items.
- **Impact:** Cart data loss on any localStorage corruption; no user feedback.
- **Evidence:** `items.value = JSON.parse(raw);` with `catch { items.value = []; }`

---

## 2. Security

### 2.1 XSRF token parsing fragile and unguarded
- **Severity:** Low
- **File:** `front-end/src/composables/useXsrfToken.ts:1-3`
- **Description:** Cookie regex uses `\s` which only matches ASCII space, not tabs or other whitespace. `decodeURIComponent` can throw on malformed tokens.
- **Impact:** XSRF protection silently disabled if token is malformed.
- **Evidence:** `const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);`

### 2.2 Secret credentials held in Vue reactive memory
- **Severity:** Low
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:35-39`
- **Description:** Paystack secret key and ShaQ Express secret are stored in `ref()` variables. Vue devtools and browser memory dumps can expose them.
- **Impact:** Secrets leak via devtools, heap snapshots, or error tracking.
- **Evidence:** `const secretKey = ref(""); const secret = ref("");`

### 2.3 Inconsistent environment variable for public API base
- **Severity:** Low
- **File:** `front-end/src/services/tenantPublicAPI.js:3`
- **Description:** Uses `VITE_API_URL` while nearly every other service uses `VITE_API_BASE`.
- **Impact:** In production, tenant slug resolution may hit a wrong host if both vars are defined differently.
- **Evidence:** `const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";`

### 2.4 Missing auth on ERPNext proxy client
- **Severity:** High
- **File:** `front-end/src/services/erpnextAPI.js:1-8`
- **Description:** `erpnextAPI` creates an axios client with no auth interceptor, no tenant header, and no XSRF handling. Any authenticated page can call ERPNext endpoints.
- **Impact:** ERPNext integration data (accounting, inventory, HR) accessible without proper auth context; potential cross-tenant data leakage.
- **Evidence:** `const apiClient = axios.create({ baseURL: "/api/v1/erpnext", headers: { "Content-Type": "application/json" } });`

### 2.5 401 redirect bypasses Vue Router
- **Severity:** Medium
- **File:** `front-end/src/services/platformPaymentAPI.js:28`, `front-end/src/services/planAPI.js:28`
- **Description:** Response interceptor uses `window.location.href = "/login"` instead of router navigation. This hard-reloads the app, bypassing SPA guards and potentially leaking state.
- **Impact:** Full page reload on 401; route guards, beforeRouteLeave hooks, and in-flight requests aborted.
- **Evidence:** `if (error.response?.status === 401) { window.location.href = "/login"; }`

### 2.6 Benchmark API lacks tenant header injection
- **Severity:** Medium
- **File:** `front-end/src/services/benchmarkAPI.js:5-10`
- **Description:** Creates an axios client with XSRF but no `X-Tenant-Id` interceptor. Cross-tenant benchmark data could leak if called from tenant context.
- **Impact:** Tenant A sees Tenant B benchmark data.
- **Evidence:** No `client.interceptors.request.use(...)` in file.

### 2.7 Audit API has tenant header but no auth guard
- **Severity:** Medium
- **File:** `front-end/src/services/platformAuditAPI.js:1-19`
- **Description:** Tenant header is injected, but there is no explicit auth interceptor. If `authStore.currentTenant` is stale from a previous session, requests carry stale tenant context.
- **Impact:** Audit log queries for wrong tenant; compliance data leakage.
- **Evidence:** `config.headers["X-Tenant-Id"] = authStore.currentTenant.id;`

### 2.8 Turnstile config fetch unmasked for unauthenticated context
- **Severity:** Low
- **File:** `front-end/src/composables/useTurnstileConfig.ts:15-24`
- **Description:** `fetchConfig` calls `/auth/turnstile-config` on mount without checking auth state. Falls back to disabled on error, but error details are swallowed.
- **Impact:** SiteKey disclosure risk if endpoint misconfigured; no feedback on failure.
- **Evidence:** `onMounted(() => { fetchConfig(); });`

### 2.9 crypto.randomUUID requires secure context
- **Severity:** Low
- **File:** `front-end/src/composables/useOfflineAppointments.ts:50`
- **Description:** `crypto.randomUUID()` throws in non-secure contexts (HTTP, some file://). No fallback is provided.
- **Impact:** Offline appointment creation crashes in dev or non-HTTPS environments.
- **Evidence:** `id: \`draft-${Date.now()}-${crypto.randomUUID().slice(0, 8)}\``

---

## 3. UX/UI

### 3.1 Save button gated behind connection test
- **Severity:** Medium
- **File:** `front-end/src/components/admin/GatewayConfigCard.vue:286`
- **Description:** `Save Gateway` is disabled until `testResult?.success` is true. Admins who already know their credentials cannot save without testing first.
- **Impact:** Frustration for power users; no "Save without testing" escape hatch.
- **Evidence:** `:disabled="saving || !testResult?.success"`

### 3.2 Chart.js watcher causes full chart teardown on array reference change
- **Severity:** Low
- **File:** `front-end/src/components/admin/RevenueTrendChart.vue:173-179`
- **Description:** Watch on `() => [props.labels, props.mrrSeries, props.tenantSeries]` triggers `render()` which destroys and recreates the chart even if arrays are mutated in place.
- **Impact:** Visual flicker and lost tooltip state on every data refresh.
- **Evidence:** `watch(() => [props.labels, props.mrrSeries, props.tenantSeries], async () => { await nextTick(); render(); });`

### 3.3 GSAP scaleIn produces double-tap visual artifact
- **Severity:** Low
- **File:** `front-end/src/composables/useAnimations.ts:61-71`
- **Description:** `scaleIn` uses `yoyo: true, repeat: 1` which scales to 0.95 then back to 1. This is a "double-tap" not a smooth press, and can feel jarring on clickable elements.
- **Impact:** Inconsistent tactile feedback on buttons/cards.
- **Evidence:** `gsap.to(target, { scale: 0.95, duration, ease: "power2.out", yoyo: true, repeat: 1 });`

### 3.4 Duplicated layout logic across SuperAdminLayout and TenantLayout
- **Severity:** Low
- **File:** `front-end/src/layouts/SuperAdminLayout.vue`, `front-end/src/layouts/TenantLayout.vue`
- **Description:** Both layouts (~500+ lines each) duplicate sidebar state, animation handlers, responsive breakpoints, and auth guards.
- **Impact:** Bug fixes and theme changes must be applied twice; risk of drift.
- **Evidence:** Both files contain near-identical `sidebarOpen`, `isMobile`, animation `onMounted` blocks.

---

## 4. Architecture

### 4.1 Service layer fragmentation — 4 distinct axios patterns
- **Severity:** High
- **File:** Multiple across `front-end/src/services/`
- **Description:** Services use at least four different patterns: (1) class instances importing `API.js`, (2) standalone axios factories with interceptor copy-paste, (3) `createSalonCrudAPI` factory composable, (4) plain function exports. No shared `AdminClient` or `TenantClient` abstraction exists.
- **Impact:** Cross-cutting concerns (auth refresh, error normalization, tenant header, XSRF) must be patched in 20+ files. High regression risk.
- **Evidence:** `trialAPI.js`, `gracePeriodAPI.js`, `statusTimelineAPI.js`, `onboardingAPI.js`, `noteAPI.js`, `whiteLabelAPI.js`, `dsarAPI.js`, `billingEmailAPI.js`, `platformPaymentAPI.js`, `planAPI.js`, `benchmarkAPI.js`, `usageAPI.js`, `invoiceAPI.js` all duplicate interceptor code.

### 4.2 Two base-URL environment variables
- **Severity:** Medium
- **File:** `front-end/src/services/tenantPublicAPI.js:3` vs `front-end/src/services/*.js`
- **Description:** `tenantPublicAPI` uses `VITE_API_URL`; all other services use `VITE_API_BASE || "/api/v1"`.
- **Impact:** Deployments that set only one variable have inconsistent API routing for tenant resolution.
- **Evidence:** `const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";` vs `const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";`

### 4.3 Salon CRUD factory misapplied to non-salon entities
- **Severity:** Medium
- **File:** `front-end/src/composables/useSalonCrudAPI.ts` and consumers
- **Description:** `createSalonCrudAPI` is used for `crossLocationDashboardAPI`, `staffLocationAssignmentAPI`, `expenseAPI`, `giftCardAPI`, `packageAPI`, `inventoryItemAPI`, `inventoryTransferAPI`, `marketingCampaignsAPI`, `referralAPI`, `locationAPI`, `pricingRuleAPI`.
- **Impact:** Naming leaks vertical assumption into platform/admin code; future restaurant-only tenants carry unnecessary salon baggage.
- **Evidence:** `createSalonCrudAPI({ basePath: "/salon/cross-location-dashboard" })`

### 4.4 Auth store conflates platform, tenant, and branding state
- **Severity:** Medium
- **File:** `front-end/src/stores/auth.ts`
- **Description:** Single store holds `user`, `currentTenant`, `branding`, `currencyLocale`, `tenantModeEnabled`, `capabilities`, `entryPoint`. No separation between auth identity and tenant context.
- **Impact:** Any component importing `useAuthStore` triggers reactivity for all 8+ refs; difficult to test or reuse in non-tenant contexts.
- **Evidence:** 280-line store mixing `login`, `setTenant`, `fetchSettings`, `fetchCapabilities`.

### 4.5 Cart persists to localStorage without encryption or expiry
- **Severity:** Low
- **File:** `front-end/src/stores/cart.ts:66-77`
- **Description:** Cart items (including menu item IDs, prices, notes) are stored as plain JSON in `localStorage` with no expiry or encryption.
- **Impact:** PII/order data persists across sessions and is accessible to any script on the domain.
- **Evidence:** `localStorage.setItem("cart", JSON.stringify(items.value));`

### 4.6 SuperAdminLoginView in admin views scope
- **Severity:** Low
- **File:** `front-end/src/views/admin/SuperAdminLoginView.vue`
- **Description:** A login view lives inside `views/admin/`, implying super-admin auth is a sub-view of the admin portal rather than a separate entry point.
- **Impact:** Routing confusion; potential for guard bypass if admin layout wraps login view.
- **Evidence:** Path placement in `views/admin/`.

---

## 5. Performance

### 5.1 Chart.js full teardown on prop reference change
- **Severity:** Low
- **File:** `front-end/src/components/admin/RevenueTrendChart.vue:158-179`
- **Description:** Every prop change destroys the chart instance and creates a new one. No diffing or update path is used.
- **Impact:** Unnecessary GC pressure and visual flash on data refresh.
- **Evidence:** `if (chart) chart.destroy(); chart = new Chart(canvasEl.value, buildConfig());`

### 5.2 Hardcoded limit of 100 in generic CRUD loader
- **Severity:** Low
- **File:** `front-end/src/composables/useSalonCrudView.ts:66`
- **Description:** `load()` forces `limit: 100` regardless of caller intent. Lists with fewer items still request 100; lists with more are silently truncated.
- **Impact:** Wasted bandwidth for small lists; data loss for large lists.
- **Evidence:** `const res = await executeApiCall(config.api, method, { limit: 100, ...params });`

### 5.3 GSAP animations lack GPU compositing hints
- **Severity:** Low
- **File:** `front-end/src/composables/useAnimations.ts`
- **Description:** Animations use `opacity` and `y`/`x` transforms but never set `will-change` or `transform: translateZ(0)` on targets.
- **Impact:** Animations may run on CPU instead of compositor thread, causing jank on low-end devices.
- **Evidence:** `gsap.to(target, { opacity: 1, duration, ease: "power2.out" });`

### 5.4 Duplicate axios instances increase memory footprint
- **Severity:** Low
- **File:** `front-end/src/services/*.js`
- **Description:** 12+ services create independent axios instances with duplicated interceptor closures. Each instance holds its own config, interceptors, and defaults.
- **Impact:** ~12+ axios instances in memory at runtime; no request/response cache sharing.
- **Evidence:** `trialAPI.js`, `gracePeriodAPI.js`, `statusTimelineAPI.js`, `onboardingAPI.js`, `noteAPI.js`, `whiteLabelAPI.js`, `dsarAPI.js`, `billingEmailAPI.js`, `platformPaymentAPI.js`, `planAPI.js`, `benchmarkAPI.js`, `usageAPI.js`, `invoiceAPI.js`.

---

## Summary

| Dimension | High | Medium | Low |
|-----------|------|--------|-----|
| Correctness | 0 | 5 | 4 |
| Security | 1 | 3 | 6 |
| UX/UI | 0 | 1 | 3 |
| Architecture | 1 | 2 | 3 |
| Performance | 0 | 0 | 4 |

**Top risks to address first:**
1. `erpnextAPI.js` missing auth (Security 2.4)
2. Service-layer fragmentation causing cross-cutting maintenance burden (Architecture 4.1)
3. JSON.parse crashes in auth init on corrupted storage (Correctness 1.8)
4. 401 hard redirects bypassing SPA router (Security 2.5)
5. Stale secrets persisting after gateway mode downgrade (Correctness 1.3)

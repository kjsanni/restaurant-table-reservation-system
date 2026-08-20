# Super-Admin Portal Backend Audit Report

**Scope:** `back-end/src/tenant-platform/routes/*.router.js`, `back-end/src/tenant-platform/controllers/*.controller.js`, `back-end/src/middleware/*.js`, `back-end/src/utils/*.js`, `back-end/src/services/*.js`  
**Date:** 2026-08-19  
**Mode:** Read-only audit — no fixes applied.

---

## 1. Correctness

### [Critical] Mount-level auth mismatch blocks platform admins from tenant routes
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107` + inner routers
- **Description:** All routes under `/api/v1/admin/tenants` are mounted with `adminMiddleware` (`protect` + `requireSuperAdmin`). However, many inner route handlers (e.g., `tenantAdmin.router.js`, `plan.router.js`, `billingEmail.router.js`, `trial.router.js`, `usage.router.js`) use `requirePermission("manage_tenants")`. Because `adminMiddleware` rejects non-super-admin users at the mount level, platform admins with `manage_tenants` permission but without `isSuperAdmin` are **blocked from every tenant management endpoint**. The inner permission checks are effectively dead code for this mount path.
- **Impact:** Role-based access control is broken for the tenant management surface. Platform admins cannot perform tenant operations despite having the explicit permission.
- **Evidence:**
  ```js
  // tenant-platform.module.js:117
  { path: "/api/v1/admin/tenants", router: tenantAdminRoutes, middleware: [logAction, validateCsrfToken, adminActionLimiter, adminMiddleware] }
  
  // tenantAdmin.router.js:18
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), ...)
  ```

### [Critical] Missing `db` import causes runtime crash in support chat auto-assign
- **File:** `back-end/src/tenant-platform/controllers/supportChat.controller.js:130`
- **Description:** The `autoAssignConversationHandler` references `db.supportConversation.findAll(...)` but `db` is never imported. Any POST to `/api/v1/admin/support-chat/conversations/:id/auto-assign` throws `ReferenceError: db is not defined`.
- **Impact:** 500 Internal Server Error on a valid support chat endpoint. Auto-assignment is completely broken.
- **Evidence:**
  ```js
  // supportChat.controller.js:1-6 — no db require
  const response = require("../utils/response");
  const supportConversationDAO = require("../DAOs/supportConversation.dao");
  const supportMessageDAO = require("../DAOs/supportMessage.dao");
  const platformAuditDAO = require("../DAOs/platformAudit.dao");
  const auditLog = require("../utils/auditLog");
  
  // supportChat.controller.js:130 — db used without require
  const agentWorkload = await db.supportConversation.findAll({
  ```

### [High] DSAR auto-fulfillment does not validate request eligibility
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:46-69`
- **Description:** `autoFulfillSimpleDsarHandler` marks ANY pending DSAR request as fulfilled without checking the request type, tenant compliance state, or whether the request is actually auto-fulfillable. The controller comment implies "simple" DSARs, but there is no type check.
- **Impact:** Privacy/compliance violation risk. Erasure or portability requests could be auto-closed without actual data deletion or export, creating legal liability under Ghana DPA 2012.
- **Evidence:**
  ```js
  // compliance.controller.js:58
  await dsarRequestDAO.updateStatus(requestId, record.tenantId, "fulfilled", "Auto-fulfilled by compliance automation", new Date());
  // No check for requestType === "access" or similar
  ```

### [High] `convertTrialHandler` mutates tenant status without role-specific permission
- **File:** `back-end/src/tenant-platform/controllers/trial.controller.js:20-39`
- **Description:** Converting a trial to an active subscription requires only `manage_tenants` permission. There is no separate approval or break-glass requirement for changing billing state, which could be abused to grant free active access.
- **Impact:** Financial impact — trial tenants could be converted to active without payment authorization.
- **Evidence:**
  ```js
  // trial.controller.js:29-37
  await tenant.update({
    status: "active",
    subscriptionStatus: "active",
    plan: plan || tenant.plan,
    ...
  });
  // Only protected by requirePermission("manage_tenants")
  ```

### [Medium] `updateGatewayHandler` accepts `null` for secret fields, potentially wiping keys
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:403-412`
- **Description:** `applyPaystackSettings` sets `tenant.paystackSecretKey = paystackSecretKey` when the key is `undefined` or `null`. If a client sends `{ "paystackSecretKey": null }`, the existing secret is overwritten with `null`, breaking payments for that tenant.
- **Impact:** Accidental or malicious nullification of payment secrets causes immediate checkout failure.
- **Evidence:**
  ```js
  // tenantAdmin.controller.js:408-410
  if (paystackSecretKey !== undefined && paystackSecretKey !== null) {
    tenant.paystackSecretKey = paystackSecretKey;
  }
  // But applyPaystackSettings is called with req.body values directly
  ```

### [Medium] `computeScorecard` reports `pendingCount: 0` unconditionally
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:34`
- **Description:** The compliance scorecard always returns `pendingCount: 0`, even though `scheduleComplianceRemindersHandler` computes `daysPending`. The scorecard is misleading for super-admins reviewing compliance health.
- **Impact:** Incorrect dashboard data; compliance gaps may be hidden.
- **Evidence:**
  ```js
  // compliance.controller.js:34
  pendingCount: 0, // hardcoded instead of computing from accepted vs totalTenants
  ```

---

## 2. Security

### [High] Debug endpoint exposes platform internals without break-glass
- **File:** `back-end/src/tenant-platform/controllers/debug.controller.js:37-77`
- **Description:** `getPlatformDebugInfoHandler` returns `nodeEnv`, Redis host configuration status, platform-wide tenant/user/reservation counts, and database/BullMQ health. This is accessible to any super-admin without break-glass elevation.
- **Impact:** Information disclosure that aids reconnaissance for an attacker who has compromised a super-admin account (but not yet elevated). Reveals infrastructure topology.
- **Evidence:**
  ```js
  // debug.controller.js:70-76
  res.status(200).json({
    success: true,
    checks,
    counts: { tenants: tenantCount, users: userCount, reservations: reservationCount },
    nodeEnv: process.env.NODE_ENV,
    redis: process.env.REDIS_HOST ? "configured" : "not configured",
  });
  ```

### [High] Test payment-gateway endpoints accept raw secrets in request body
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:314-378`
- **Description:** `testPaystackHandler` and `testShaqExpressHandler` accept `secretKey` / `secret` directly from `req.body` and forward them to external APIs. These endpoints are protected only by `requirePermission("manage_tenants")`.
- **Impact:** A compromised platform-admin account can exfiltrate valid Paystack/ShaQ Express secrets or use the endpoint to brute-force credentials against the third-party API. Secrets also appear in server access logs (request body).
- **Evidence:**
  ```js
  // tenantAdmin.controller.js:333-339
  const client = axios.create({
    baseURL: "https://api.paystack.co",
    headers: { Authorization: `Bearer ${secretKey}`, ... },
  });
  const response = await client.get("/balance");
  ```

### [Medium] Impersonation JWT secret fallback to random bytes
- **File:** `back-end/src/tenant-platform/DAOs/impersonation.dao.js:4`
- **Description:** The DAO falls back to `crypto.randomBytes(64).toString("hex")` when `JWT_SECRET` is unset. The main app crashes on startup if `JWT_SECRET` is missing (`jwtRotation.js:6`), so this fallback is dead code in production. However, it creates a security smell and, if the startup guard were ever relaxed, impersonation tokens would be signed with a different secret than regular JWTs.
- **Impact:** Token invalidation across restarts; potential secret mismatch between auth and impersonation systems.
- **Evidence:**
  ```js
  // impersonation.dao.js:4
  const JWT_SECRET = process.env.JWT_SECRET || require("crypto").randomBytes(64).toString("hex");
  ```

### [Medium] Cross-tenant search allows unrestricted super-admin access to all tenant PII
- **File:** `back-end/src/tenant-platform/controllers/crossTenantSearch.controller.js:5-19`
- **Description:** The search handler passes `allowAllTenants: true` to the DAO, allowing a super-admin to query customer names, emails, phone numbers, reservation notes, and order statuses across every tenant without additional scoping.
- **Impact:** Mass PII exposure. A malicious or compromised super-admin can harvest all customer data platform-wide with a single query.
- **Evidence:**
  ```js
  // crossTenantSearch.controller.js:11-14
  const data = await crossTenantSearchDAO.search(q.trim(), {
    tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
    allowAllTenants: true,
  });
  ```

### [Medium] Payment and delivery secrets stored in plaintext in tenant record
- **File:** `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js:403-432`
- **Description:** `paystackSecretKey` and `shaqexpressSecret` are persisted directly to the `tenant` table. The `sanitizeTenant` helper masks them in API responses, but the database stores them in cleartext.
- **Impact:** Database read access (SQL injection, backup leak, replica exposure) yields live payment credentials.
- **Evidence:**
  ```js
  // tenantAdmin.controller.js:408-409
  tenant.paystackSecretKey = paystackSecretKey;
  // tenantAdmin.controller.js:424-426
  settings.shaqexpress_config = {
    secret: shaqexpressSecret ?? settings.shaqexpress_config?.secret ?? null,
  };
  ```

### [Medium] Platform settings list endpoint exfiltrates sensitive configuration values
- **File:** `back-end/src/tenant-platform/controllers/platformSettings.controller.js:59-80`
- **Description:** `listPlatformSettingsHandler` returns the raw `value` of every platform setting, including `turnstile_secret_key`, `erpnext_api_secret`, `ip_allowlist`, and `password_policy`. The update endpoint has an allowlist, but the list endpoint does not redact sensitive keys.
- **Impact:** Any super-admin (or any user who can call the list endpoint) can read all platform secrets.
- **Evidence:**
  ```js
  // platformSettings.controller.js:73-77
  groups[domain].push({
    key: setting.key,
    value: setting.value, // no redaction for sensitive keys
    updatedAt: setting.updatedAt,
  });
  ```

### [Low] CSRF token validation leaks length before constant-time compare
- **File:** `back-end/src/middleware/csrf.js:40-41`
- **Description:** The validator compares `clientToken.length !== cookieToken.length` before calling `crypto.timingSafeEqual`. The length check introduces a timing side channel (though minor for CSRF tokens).
- **Impact:** Negligible in practice, but inconsistent with the stated constant-time comparison goal.
- **Evidence:**
  ```js
  // csrf.js:40
  if (!clientToken || !cookieToken || clientToken.length !== cookieToken.length) {
    return res.status(403).json({ success: false, message: "Invalid CSRF token." });
  }
  ```

### [Low] Audit log does not redact all sensitive request body fields
- **File:** `back-end/src/middleware/auditLog.js:4-16`
- **Description:** The `sanitizeData` function redacts only `password`, `token`, `secret`, `jwt`. It does not redact `paystackSecretKey`, `shaqexpressSecret`, `turnstile_secret_key`, or other custom secret fields. Controllers that accept these values in `req.body` will log them.
- **Impact:** Sensitive platform credentials appear in audit log tables and log aggregation systems.
- **Evidence:**
  ```js
  // auditLog.js:4
  const SENSITIVE_FIELDS = ["password", "token", "secret", "jwt"];
  // Missing: paystackSecretKey, shaqexpressSecret, webhookSecret, etc.
  ```

---

## 3. Architecture

### [High] Inconsistent auth layering between mount manifest and route handlers
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107-199`
- **Description:** The module registry applies `adminMiddleware` (super-admin only) to entire mount paths like `/api/v1/admin/tenants`, `/api/v1/admin/plans`, `/api/v1/admin/payments`. Yet the individual routers inside declare weaker permissions (`requirePermission("manage_tenants")`, `requirePlatformRole("platform_technical")`). This creates a confusing, layered auth model where the outer layer overrides the inner layer.
- **Impact:** Developer confusion, permission drift, and the critical correctness issue described above. Adding a new route requires understanding both the manifest and the router.
- **Evidence:**
  ```js
  // tenant-platform.module.js:117
  { path: "/api/v1/admin/tenants", router: tenantAdminRoutes, middleware: [..., adminMiddleware] }
  
  // tenantAdmin.router.js:24
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), ...)
  ```

### [Medium] Monolithic 200-line route manifest
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:100-199`
- **Description:** All 90+ tenant-platform routes are declared in a single array inside one file. Adding, removing, or auditing a route requires scrolling through 100 lines of boilerplate.
- **Impact:** High maintenance cost, increased risk of copy-paste errors (e.g., wrong middleware, wrong path).
- **Evidence:** `tenant-platform.module.js` lines 100–199 contain 90 route entries.

### [Medium] Missing centralized input validation
- **File:** Multiple controllers (e.g., `trial.controller.js`, `billingEmail.controller.js`, `onboarding.controller.js`)
- **Description:** Most controllers access `req.body` and `req.query` directly without schema validation (no Joi/Zod/express-validator). Validation is ad-hoc and inconsistent.
- **Impact:** Type coercion bugs, missing-field edge cases, and injection vectors that validation libraries would catch.
- **Evidence:**
  ```js
  // trial.controller.js:6
  const { days } = req.body;
  extendTo.setDate(extendTo.getDate() + (days || 7)); // days can be negative, string, etc.
  ```

### [Medium] Double rate-limiting on tenant-platform routes
- **File:** `back-end/src/tenant-platform/modules/tenant-platform.module.js:107` + individual routers
- **Description:** The manifest applies `adminActionLimiter` at the mount level, and every tenant-platform router also calls `router.use(adminActionLimiter)`. Rate limiting runs twice per request.
- **Impact:** Minor overhead; more importantly, the `X-RateLimit-*` headers may reflect only the inner limiter, confusing clients.
- **Evidence:**
  ```js
  // tenant-platform.module.js:117
  middleware: [..., adminActionLimiter, adminMiddleware]
  
  // tenantAdmin.router.js:4
  router.use(adminActionLimiter);
  ```

### [Low] Late service import inside controller
- **File:** `back-end/src/tenant-platform/controllers/impersonation.controller.js:57`
- **Description:** `ImpersonationService` is required in the middle of the file, after handlers that don't use it. This is a minor style issue but makes dependency tracking harder.
- **Impact:** Negligible runtime impact; reduces code clarity.
- **Evidence:**
  ```js
  // impersonation.controller.js:57
  const ImpersonationService = require("../services/impersonation.service");
  ```

---

## 4. Performance

### [High] Unbounded bulk email to all tenants when `tenantIds` is empty
- **File:** `back-end/src/tenant-platform/controllers/billingEmail.controller.js:4-11`
- **Description:** When the client omits `tenantIds` or passes an empty array, the handler fetches **every tenant** (`db.tenant.findAll({ attributes: ["id"] })`) and sends a billing email to each `billingEmail` address. There is no batch size limit, no chunking, and no confirmation step.
- **Impact:** At 10,000+ tenants, this creates a thundering-herd of SMTP connections, exhausts event-loop time, and can trigger IP reputation blocks or mail-provider abuse flags.
- **Evidence:**
  ```js
  // billingEmail.controller.js:6-9
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    const tenants = await db.tenant.findAll({ attributes: ["id"] });
    tenantIds = tenants.map((t) => t.id);
  }
  ```

### [Medium] Compliance scorecard loads up to 10,000 records into memory
- **File:** `back-end/src/tenant-platform/controllers/compliance.controller.js:14-17`
- **Description:** `computeScorecard` calls `legalAcceptanceDAO.list({ limit: 10000 })` and loads all records into an in-memory map. For platforms with thousands of tenants, this consumes significant heap.
- **Impact:** Memory pressure on the server; potential OOM on large tenants.
- **Evidence:**
  ```js
  // compliance.controller.js:14-17
  const accepted = await legalAcceptanceDAO.list({
    tenantId,
    limit: 10000,
  });
  ```

### [Medium] Support chat auto-assign runs unbounded aggregation
- **File:** `back-end/src/tenant-platform/controllers/supportChat.controller.js:130-142`
- **Description:** `autoAssignConversationHandler` executes `db.supportConversation.findAll(...).group(...).COUNT(...)` across the entire `supportConversation` table without a `limit` or pagination. At high conversation volumes, this is an expensive full-table aggregation on every auto-assign request.
- **Impact:** Query latency grows linearly with conversation volume; can cause request timeouts under load.
- **Evidence:**
  ```js
  // supportChat.controller.js:130-142
  const agentWorkload = await db.supportConversation.findAll({
    where: { status: ["open", "in_progress"], assignedTo: { [Op.ne]: null } },
    attributes: ["assignedTo", [fn("COUNT", col("id")), "openCount"]],
    group: ["assignedTo"],
    order: [[fn("COUNT", col("id")), "ASC"]],
    raw: true,
    // no limit
  });
  ```

### [Medium] Webhook handler performs synchronous side effects
- **File:** `back-end/src/tenant-platform/controllers/billing.controller.js:46-127`
- **Description:** The `charge.success` webhook handler performs tenant updates, payment creation, order status reconciliation, delivery creation, and WhatsApp notification sending — all synchronously in the request path. Paystack expects a 200 response quickly; slow downstream calls risk webhook timeout and duplicate processing.
- **Impact:** Webhook timeouts, duplicate event processing, and cascading failures if WhatsApp or delivery APIs are slow.
- **Evidence:**
  ```js
  // billing.controller.js:82-110
  if (paymentStatus === "paid" && metadata.deliveryLocation) {
    const delivery = await deliveryService.createFromWhatsApp(...);
    if (delivery && delivery.trackingNumber && customerPhone) {
      const trackingMsg = await messageTemplates.render(...);
      await whatsappService.sendWhatsAppText(...);
    }
  }
  ```

### [Low] Platform audit export loads up to 1,000 records synchronously
- **File:** `back-end/src/tenant-platform/controllers/platformAudit.controller.js:74`
- **Description:** CSV export fetches 1,000 audit records in a single query and builds the CSV string in memory. For very large exports, this blocks the event loop.
- **Impact:** Request latency spike during export; potential memory spike.
- **Evidence:**
  ```js
  // platformAudit.controller.js:74
  const data = await platformAuditDAO.list(buildAuditFilters(req.query, { limit: 1000 }));
  ```

---

## 5. Observability

### [Medium] Inconsistent logging — `console.error` instead of centralized logger
- **File:** `breakGlass.controller.js:12`, `billing.controller.js:108`, `tenantAdmin.controller.js:93`, `tenantAdmin.controller.js:98`, `tenantAdmin.controller.js:109`
- **Description:** The project provides `utils/logger.js`, but many controllers use raw `console.error` for error paths. This bypasses structured logging, log levels, and log shipping.
- **Impact:** Production errors may not appear in centralized logging (e.g., Sentry, Datadog), making incident response harder.
- **Evidence:**
  ```js
  // breakGlass.controller.js:12
  console.error(`${event} audit log failed:`, err.message);
  
  // billing.controller.js:108
  console.error("Failed to create WhatsApp delivery after payment:", deliveryErr.message);
  ```

### [Medium] Break-glass expiration endpoint lacks actor audit trail
- **File:** `back-end/src/tenant-platform/controllers/breakGlass.controller.js:115-118`
- **Description:** `expireBreakGlassHandler` calls `breakGlassRequestDAO.expireOld()` but does not log *who* triggered the expiration or how many records were affected in the platform audit log.
- **Impact:** Cannot attribute bulk expiration events to a specific admin action.
- **Evidence:**
  ```js
  // breakGlass.controller.js:115-118
  const expireBreakGlassHandler = async (req, res) => {
    const expired = await breakGlassRequestDAO.expireOld();
    return res.status(200).json({ success: true, expiredCount: expired.length });
    // No auditLog(req, ...) call here
  };
  ```

### [Low] Auth failure logging does not capture request body or full route context
- **File:** `back-end/src/middleware/auditLog.js:81-100`
- **Description:** `logAuthFailure` records `route`, `method`, `statusCode`, `ipAddress`, and `userAgent`, but omits `req.body` and `req.params`. For brute-force or injection attempts, the missing body context reduces forensic value.
- **Impact:** Lower-fidelity security incident investigation.
- **Evidence:**
  ```js
  // auditLog.js:88-95
  await AuditLog.create({
    action: "auth_failed",
    entityType: "auth",
    userId: null,
    changes: {
      route,
      method: req.method,
      statusCode,
      ipAddress: req.ip,
      userAgent: truncate(req.get("user-agent")),
      // req.body missing
    },
    ipAddress: req.ip,
  });
  ```

### [Low] Many catch blocks swallow errors after logging
- **File:** `tenantAdmin.controller.js:91-93`, `tenantAdmin.controller.js:107-109`, `billing.controller.js:108`
- **Description:** Fire-and-forget `.catch(err => console.error(...))` patterns are used for async side effects (template usage recording, provisioning enqueue, delivery creation). The error is logged but the response does not reflect the failure, and there is no retry or DLQ.
- **Impact:** Silent data loss or partial provisioning with no alerting.
- **Evidence:**
  ```js
  // tenantAdmin.controller.js:107-109
  try {
    enqueueProvisioning(tenant.id, req.user?.id || null).catch((err) => {
      console.error("Failed to enqueue provisioning:", err.message);
    });
  } catch (provisionErr) {
    console.error("Provisioning failed after admin tenant creation:", provisionErr.message);
  }
  ```

---

## Summary

| Severity | Count | Key Themes |
|----------|-------|------------|
| Critical | 2 | Auth layer mismatch, missing import causing 500s |
| High | 6 | Debug info disclosure, secret leakage via test endpoints, unbounded bulk email, DSAR auto-fulfillment, plaintext secrets, PII exposure |
| Medium | 10 | Architecture inconsistency, compliance scorecard inflation, CSRF minor leak, missing input validation, double rate-limiting |
| Low | 4 | Logging inconsistency, audit trail gaps, swallowed errors, monolithic manifest |

**Top 3 remediation priorities:**
1. Fix mount-level auth mismatch in `tenant-platform.module.js` so route-level permissions are actually enforced.
2. Add break-glass elevation to `debug.controller.js` and redact sensitive values from `platformSettings` list responses.
3. Remove or strictly gate the raw-secret test endpoints (`testPaystackHandler`, `testShaqExpressHandler`) and move secrets to a vault-backed configuration store.

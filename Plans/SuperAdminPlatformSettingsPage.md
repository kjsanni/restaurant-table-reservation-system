# Super-Admin Platform Settings Page — Implementation Plan

## Status
- **Implementation:** Complete
- **Route:** `/super-admin/settings`
- **Frontend:** `front-end/src/views/admin/PlatformSettingsView.vue`
- **Backend:** `back-end/src/tenant-platform/controllers/platformSettings.controller.js` + `back-end/src/tenant-platform/routes/platformSettings.router.js`
- **Tests:** `back-end/src/__tests__/platformSettings.controller.test.js`

## Context
This is a **multi-tenant SaaS** where super-admin manages the **platform**, not individual tenants. Platform settings are authoritative defaults that flow down to tenants; tenants may have limited override capability or none at all. The current scattered views (`PasswordPolicyView.vue`, `MaintenanceModeView.vue`, `FeatureFlagsView.vue`, `PaystackConfigView.vue`, etc.) each manage isolated platform concerns with no unified view of the platform's configuration state.

A super-admin settings page is not just a "consolidated form." It is the **control plane** for:
- Platform security posture (password policy, 2FA enforcement, IP allowlists, brute-force thresholds)
- Feature governance (feature flags, tenant mode, vertical enablement)
- Payment infrastructure (Paystack keys, webhook secrets, settlement config)
- Compliance regime (legal document versions, data retention policies, DSAR workflows, encryption keys)
- Integration health (WhatsApp, Shaq Express, email/SMS providers)
- Tenant lifecycle (trial defaults, grace periods, suspension policies)
- Branding/white-label (platform brand tokens, custom domains, email templates)
- Operational policies (maintenance mode, backup schedules, audit log retention)

**This plan preserves the existing individual views as the authoritative configuration UIs for their domains.** The unified page acts as a **central dashboard and quick-launch hub**, not a replacement.

## Approach

### 1. Backend: Platform-scoped settings API
**File:** `back-end/src/tenant-platform/routes/platformSettings.router.js` (new)

```js
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformSettingsController = require("../controllers/platformSettings.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformSettingsController.listPlatformSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(validateCsrfToken), tryCatchHandler(platformSettingsController.updatePlatformSettingHandler))
  .all(httpMethodError);

module.exports = router;
```

**File:** `back-end/src/tenant-platform/controllers/platformSettings.controller.js` (new)

Two handlers:
- `listPlatformSettingsHandler` — returns platform-scoped settings (`tenantId: null`) grouped by domain (security, payments, compliance, etc.)
- `updatePlatformSettingHandler` — updates a single platform setting with domain-specific allowlists

**Domain allowlists:**
- **security:** `password_policy`, `brute_force_threshold`, `session_timeout_minutes`, `ip_allowlist`
- **payments:** `paystack_config`, `payment_grace_period_days`, `auto_retry_failed_payments`
- **compliance:** `data_retention_policy`, `legal_document_version`, `dsar_response_sla_days`, `encryption_at_rest_enabled`
- **features:** `feature_flags`, `tenant_mode_enabled`, `salon_feature_flags`, `salon_module_enabled`
- **operations:** `maintenance_mode`, `maintenance_message`, `backup_schedule_cron`, `audit_log_retention_days`
- **integrations:** `whatsapp_config`, `shaqexpress_enabled`, `notification_channels`
- **branding:** `platform_brand_name`, `platform_logo_url`, `platform_primary_color`, `custom_domain`

**File:** `back-end/src/utils/server.js`

Mount:
```js
const platformSettingsRoutes = require("../tenant-platform/routes/platformSettings.router");
app.use("/api/v1/admin/platform-settings", logAction, validateCsrfToken, adminMiddleware, platformSettingsRoutes);
```

**Why separate controller?** Platform settings have domain-specific validation rules (e.g., `paystack_config` needs secret redaction, `data_retention_policy` needs compliance schema validation) that don't belong in the generic `auth.controller.js`. A dedicated controller keeps concerns separated and makes per-domain testing easier.

### 2. Frontend: `PlatformSettingsView.vue` as a governance dashboard
**File:** `front-end/src/views/admin/PlatformSettingsView.vue` (new)

**Route:** `/super-admin/settings` (name: `platform-settings`)

**Layout:** Card-based sections grouped by domain. Each card shows:
- Current status/value at a glance
- Last updated timestamp
- Quick "Configure" button that navigates to the existing detailed view for that domain
- Visual indicator for settings that require tenant notification or have compliance implications

**Sections:**
1. **Security Posture** — password policy strength indicator, brute-force threshold, session timeout, IP allowlist status
2. **Payment Infrastructure** — Paystack connection status, webhook health, grace period, retry policy
3. **Compliance & Legal** — legal document version, data retention policy, DSAR SLA, encryption status
4. **Feature Governance** — feature flags matrix, tenant mode toggle, salon module enablement
5. **Integrations** — WhatsApp, Shaq Express, notification channels health
6. **Operations** — maintenance mode toggle, backup schedule, audit log retention
7. **Branding & White-label** — platform brand tokens, custom domain, email template status

**Navigation pattern:** Each card's "Configure" button routes to the existing detailed view:
- Security → `PasswordPolicyView.vue` + new `SecuritySettingsView.vue`
- Payments → `PaystackConfigView.vue`
- Compliance → existing compliance views
- Features → `FeatureFlagsView.vue`
- etc.

**File:** `front-end/src/services/adminAPI.js`

Add:
```js
const listPlatformSettings = () => API.get("/admin/platform-settings");
const updatePlatformSetting = (key, value) => API.put("/admin/platform-settings", { key, value });
```

**File:** `front-end/src/router/index.js`

Add route under super-admin children.

**File:** `front-end/src/config/sidebarItems.ts`

Add "Platform Settings" nav item.

### 3. Incremental implementation slices

**Slice 1: Backend controller + routes**
- Create `platformSettings.controller.js` with domain allowlists and validation
- Create `platformSettings.router.js`
- Mount in `server.js`
- Add controller tests verifying allowlists, platform scope (`tenantId: null`), and domain-specific validation
- Verify: `cd back-end && npm test` passes

**Slice 2: Frontend API + router + dashboard shell**
- Add `adminAPI` methods
- Add router entry and sidebar item
- Build `PlatformSettingsView.vue` shell with all domain cards in read-only mode
- Wire data loading and status display
- Verify: `cd front-end && npm run lint && npm run build && npm run test:unit` passes

**Slice 3: Inline editing for safe settings**
- Add inline editing for settings that don't require navigation to detailed views (maintenance mode, feature flags, currency/locale)
- Wire save/error handling
- Verify build + tests pass

**Slice 4: Cross-cutting concerns**
- Add "tenant impact" indicators for settings that affect all tenants
- Add audit trail preview (last 5 changes to platform settings)
- Final verification

## Key decisions

| Decision | Rationale |
|----------|-----------|
| **Dashboard + deep links, not a replacement** | Existing views are authoritative for their domains. Rebuilding them would duplicate logic and lose specialized validation. The unified page provides discoverability and platform-wide visibility. |
| **New `platformSettings.controller.js`** | Platform settings have domain-specific validation needs (secret redaction, compliance schemas) that don't belong in generic `auth.controller.js`. |
| **`/api/v1/admin/platform-settings` routes** | Distinguishes platform scope from tenant-scoped `/auth/settings`. Uses `requireSuperAdmin` + `adminMiddleware`. |
| **Domain allowlists in controller** | Each setting domain has different risk profiles. Payment settings need stricter validation than operational toggles. |
| **`manage_tenants` permission** | Consistent with all super-admin platform routes. No new permission needed. |
| **Tenant impact indicators** | In a multi-tenant SaaS, platform setting changes propagate to tenants. Super-admin must see blast radius before editing. |

## Settings scope matrix

| Setting | Scope | Tenant override? | Existing view | Unified page role |
|---------|-------|------------------|---------------|-------------------|
| `password_policy` | Platform | No | `PasswordPolicyView.vue` | Status card + link |
| `maintenance_mode` | Platform | No | `MaintenanceModeView.vue` | Inline toggle + link |
| `feature_flags` | Platform | No | `FeatureFlagsView.vue` | Status card + link |
| `paystack_config` | Platform | No | `PaystackConfigView.vue` | Status card + link |
| `data_retention_policy` | Platform | No | `DataRetentionPoliciesView.vue` | Status card + link |
| `legal_document_version` | Platform | No | `LegalDocumentView.vue` | Status card + link |
| `tenant_mode_enabled` | Platform | No | None | Inline toggle |
| `currency_locale` | Platform | Yes (per-tenant) | None | Inline editor |
| `notification_channels` | Platform | Yes (per-tenant) | None | Status card + link |
| `salon_feature_flags` | Platform | No | None | Status card + link |

## Files to modify

| File | Change |
|------|--------|
| `back-end/src/tenant-platform/routes/platformSettings.router.js` | **Create** — platform settings router |
| `back-end/src/tenant-platform/controllers/platformSettings.controller.js` | **Create** — domain-scoped handlers |
| `back-end/src/utils/server.js` | **Modify** — mount `platformSettingsRoutes` |
| `back-end/src/__tests__/platformSettings.controller.test.js` | **Create** — controller tests |
| `front-end/src/views/admin/PlatformSettingsView.vue` | **Create** — governance dashboard |
| `front-end/src/services/adminAPI.js` | **Modify** — add platform settings API methods |
| `front-end/src/router/index.js` | **Modify** — add `/super-admin/settings` route |
| `front-end/src/config/sidebarItems.ts` | **Modify** — add "Platform Settings" nav item |

## Out of scope

- **Tenant-specific settings editing** — remains in `AdminSettingsView.vue` at `/admin/settings`
- **Per-tenant setting override UI** — future enhancement; super-admin can view but not override per-tenant values in this plan
- **Settings import/export** — not requested
- **New permission keys** — uses existing `manage_tenants`

## Verification

| Step | Command | Expected result |
|------|---------|-----------------|
| Backend tests | `cd back-end && npm test` | All 447+ tests pass; new controller tests verify allowlists and platform scope |
| Frontend lint | `cd front-end && npm run lint` | No lint errors |
| Frontend build | `cd front-end && npm run build` | Build succeeds |
| Frontend unit tests | `cd front-end && npm run test:unit` | All 22+ tests pass |
| Manual smoke test | Navigate to `/super-admin/settings` as super-admin | Dashboard loads with domain cards; "Configure" links navigate to existing detailed views |

## STOP conditions

- **Scope confusion:** This plan treats the settings page as a **governance dashboard with deep links**, not a form replacement. If you expect all setting edits to happen on this single page, stop — that would require rebuilding 6+ existing views and their domain-specific validation.
- **Platform vs tenant scope:** If any setting currently marked "platform" should actually be tenant-overridable, stop and resolve the scope matrix before implementing controllers. Multi-tenant SaaS platforms often need per-tenant defaults that super-admin sets but tenants can customize.
- **Compliance/legal change notifications:** Changing `legal_document_version` or `data_retention_policy` may require tenant re-acceptance under DPA 2012. If the legal workflow requires tenant notification on these changes, stop and verify the notification/acceptance flow exists before allowing edits from the dashboard.
- **Feature flag lifecycle:** Feature flags have states (draft, rolling out, active, deprecated, sunset). If flags require lifecycle management beyond simple on/off, stop and confirm the existing `FeatureFlagsView.vue` handles the full lifecycle before linking to it from the dashboard.
- **Payment setting sensitivity:** `paystack_config` contains secrets. If the backend `getAllSettings(null)` returns raw secrets instead of redacted values, stop and add redaction logic in `listPlatformSettingsHandler` before exposing via API.
- **Settings cascade/rollout:** If a platform setting change should cascade to existing tenants (e.g., new password policy applies immediately), stop and verify the cascade mechanism exists. If changes only apply to new tenants, stop and document that behavior in the UI.
- **Immutable settings:** Some platform settings may be immutable after certain thresholds (e.g., cannot disable `tenant_mode_enabled` if tenants exist, cannot roll back `legal_document_version`). If such immutability rules exist, stop and encode them in the controller before building UI.
- **Audit trail completeness:** If super-admin setting changes require `platformAuditDAO.log()` with previous value, new value, and tenant impact scope (all tenants vs. new tenants only), stop and verify the existing `logAction` middleware captures this or add custom logging in the controller.
- **Test infrastructure for platform-scoped queries:** If existing controller tests assume `req.tenant?.id` is always present and fail when it's `null` (platform scope), stop and extend test helpers before writing `platformSettings.controller.test.js`.
- **Sidebar visibility dependency:** Another agent is fixing contradictory `tenantOnly: true` + `platformOnly: true` flags in `sidebarItems.ts`. Our new nav item uses the same pattern. Stop and align with their fix rather than assuming current visibility logic will persist unchanged.

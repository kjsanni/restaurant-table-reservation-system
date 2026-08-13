# ERPNext Connector Settings Migration Plan

> Migrate ERPNext connection settings from environment variables to the platform settings database, following the existing Turnstile pattern. Secrets remain server-side readable but are redacted in API responses.

## Context

The ERPNext integration client (`back-end/src/integrations/erpnext/client.js`) currently reads all connection settings from environment variables:

```
ERPNEXT_BASE_URL     — ERPNext server URL
ERPNEXT_API_KEY      — API key for authentication
ERPNEXT_API_SECRET   — API secret for authentication
ERPNEXT_TIMEOUT_MS   — Request timeout (default: 30000)
ERPNEXT_CACHE_TTL    — Redis cache TTL in seconds (default: 300)
```

The platform already has a platform settings system (`global_settings` table via `authDAO`) used for Turnstile, Paystack, and feature flags. The Turnstile middleware (`back-end/src/middleware/turnstile.js:9`) already demonstrates the target pattern: `authDAO.getPlatformSettingByKey("turnstile_secret_key")`.

The existing `erpnext-integration-plan.md` (Specs/) covers the full integration architecture but does not address connector settings migration.

## Approach

Follow the established Turnstile pattern exactly:

1. Non-secret settings (`erpnext_base_url`, `erpnext_timeout_ms`, `erpnext_cache_ttl`) move to `global_settings` — editable via super-admin UI
2. Secret settings (`erpnext_api_key`, `erpnext_api_secret`) also move to `global_settings` but are redacted in all API responses via `stripSensitiveSettingValue()` (same as `turnstile_secret_key`)
3. Env var fallback retained for initial bootstrap and emergency access before DB is configured

**Secrets manager integration (Phase 2)** is out of scope for this plan — no Vault/AWS Secrets Manager exists in the codebase. The platform settings DB pattern is the proven practice for this project (KISS principle, proven practice decision principle).

## Key Decisions

- **Secrets in DB, not env vars**: Follows Turnstile precedent (`turnstile_secret_key` is already in DB with redaction). DB is encrypted at rest via MySQL TDE, and the `global_settings` table is restricted to super-admin only.
- **Env var fallback**: `client.js` reads `process.env.ERPNEXT_BASE_URL` as fallback when DB setting is absent, ensuring zero-downtime deployment.
- **Allowlist-driven**: Add settings to `DOMAIN_ALLOWLISTS.integrations` in `platformSettings.controller.js:48`, maintaining the same validation pattern.
- **Redaction**: Extend `stripSensitiveSettingValue()` in `auth.dao.js:192` to redact `erpnext_api_key` and `erpnext_api_secret`.

## Files to Modify

### Backend
1. **`back-end/src/tenant-platform/controllers/platformSettings.controller.js`** — Add `erpnext_base_url`, `erpnext_timeout_ms`, `erpnext_cache_ttl`, `erpnext_api_key`, `erpnext_api_secret` to `DOMAIN_ALLOWLISTS.integrations`
2. **`back-end/src/DAOs/auth.dao.js`** — Extend `stripSensitiveSettingValue()` to redact `erpnext_api_key` and `erpnext_api_secret`
3. **`back-end/src/integrations/erpnext/client.js`** — Replace `process.env.ERPNEXT_*` constants with async reads from `authDAO.getPlatformSettingByKey()` with env var fallback
4. **`back-end/src/integrations/erpnext/client.js`** — Convert from module-level constants to a lazy singleton `getConfig()` pattern (settings must be async DB reads)
5. **`back-end/migrations/` (migration)** — Seed `global_settings` with existing env var values during deploy (`up()` idempotent: only inserts if key doesn't exist)

### Frontend
6. **`front-end/src/services/admin/integrationAPI.js`** — Add `listIntegrationSettings()` and `updateIntegrationSetting()` if not already present (check Paystack pattern)
7. **`front-end/src/views/admin/PlatformSettingsView.vue`** — Add ERPNext integration settings section to the integrations domain card

### Tests
8. **`back-end/src/__tests__/`** — Add `erpnextSettings.test.js` covering: settings migration, client config fallback, redaction in API responses, update via platform settings UI

## Out of Scope

- HashiCorp Vault / AWS Secrets Manager integration (no existing precedent)
- Per-tenant ERPNext credentials (current model is shared service account)
- Frontend UI for API key rotation workflow (just CRUD via platform settings)
- v16 adapter pattern (covered by `erpnext-integration-plan.md` Phase 7)

## Verification

| Step | Command | Expected Result |
|------|---------|-----------------|
| 1 | `cd back-end && npx jest --testPathPatterns="erpnext" 2>&1 \| tail -5` | All ERPNext tests pass, 0 failures |
| 2 | `cd back-end && npx jest --testPathPatterns="platformSettings" 2>&1 \| tail -5` | Platform settings tests still pass |
| 3 | `cd front-end && npm run lint 2>&1 \| tail -3` | Lint clean |
| 4 | `cd front-end && npm run build 2>&1 \| tail -3` | Build succeeds |
| 5 | `cd back-end && npm test 2>&1 \| tail -5` | Full backend suite passes (902+ tests) |
| 6 | Manual: `GET /api/v1/admin/platform-settings` returns `erpnext_*` keys in integrations domain, secrets redacted as `[REDACTED]` |
| 7 | Manual: `PUT /api/v1/admin/platform-settings` accepts `erpnext_base_url` and persists to `global_settings` |
| 8 | Manual: ERPNext client falls back to `ERPNEXT_BASE_URL` env var when DB setting is absent |

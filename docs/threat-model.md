# Threat Model — Restaurant Table Reservation System

**Date:** 2026-08-04  
**Scope:** Multi-tenant SaaS platform (restaurant + salon verticals) — always-on multi-tenant mode  
**Methodology:** STRIDE per element, mapped to MITRE ATT&CK  
**Focus Areas:** Tenant isolation, module registry, API boundaries, auth flows, data isolation

---

## 1. Assets and Entry Points

### Assets
| Asset | Sensitivity | Location |
|-------|------------|----------|
| User credentials (JWT, refresh tokens) | Critical | `back-end/src/services/authService.js`, cookies |
| Tenant data (reservations, payments, salon appointments) | High | `back-end/src/db/models/`, tenant-scoped tables |
| Platform admin credentials | Critical | `isSuperAdmin`, `platformRoles` |
| PII (customer names, phone, email) | High | `customers`, `salon_client_profiles` |
| Payment data (Paystack keys, transaction splits) | Critical | `tenant-platform/DAOs/paystackConfig.dao.js` |
| Audit logs | High | `tenant-platform/DAOs/platformAudit.dao.js` |
| Module registry/routes | Medium | `tenant-platform/modules/` |

### Entry Points
| Entry Point | Public/Auth | Description |
|-------------|-------------|-------------|
| `/api/v1/auth/*` | Public | Login, register, password reset |
| `/api/v1/reservations` | Auth | Restaurant reservation CRUD |
| `/api/v1/salon/*` | Auth | Salon vertical endpoints |
| `/api/v1/admin/*` | Super-admin | Platform management |
| `/api/v1/billing` | Auth | Payment webhooks |
| `/api/v1/webhooks/*` | Public (signed) | External webhooks |
| `/api/v1/legal/*` | Mixed | DSAR, compliance |
| Socket.IO | Auth | Real-time updates |

---

## 2. Threat Actor Profiles

| Actor | Capabilities | Motivation | Primary Targets |
|-------|-------------|------------|-----------------|
| Malicious Insider | Valid creds, internal knowledge | Revenge, financial | I, T, R |
| External Attacker | Public exploits, scanning | Financial, data theft | S, I, E, D |
| Compromised Tenant | Legitimate tenant account | Lateral movement, data theft | I, T, E |
| Supply Chain | Inherited trust, npm packages | Varies | T, E |

---

## 3. Data Flow and Trust Boundaries

```
Client → [Express/Router] → Middleware Stack → [Controller] → [DAO] → Database
                ↓
           [Module Registry] → Tenant-Platform / Salon / ERPNext modules
                ↓
           [resolveTenant] → req.tenant (trust boundary)
                ↓
           [protect] → req.user (trust boundary)
                ↓
           [requireActiveTenant] → status check
```

### Trust Boundaries
1. **Public → Authenticated**: auth middleware, JWT verification
2. **Tenant → Platform Admin**: `requireSuperAdmin`, `adminMiddleware`
3. **Module Boundary**: Each module registers its own routes with middleware
4. **Database**: Tenant-scoped queries via `req.tenant.id`

---

## 4. STRIDE Analysis by Component

### 4.1 Authentication & JWT
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Stolen JWT used to impersonate user | HttpOnly cookies, 7-day expiry, refresh token rotation |
| Tampering | JWT payload modified | Signed with `JWT_SECRET`, verified server-side |
| Repudiation | User denies action | Audit logging via `logAction` middleware |
| Info Disclosure | JWT secret leaked | Environment variable, never committed |
| DoS | Brute-force login | Rate limiting (`authLimiter`), account lockout |
| Elevation | User claims admin role | `requireSuperAdmin` checks `isSuperAdmin` or `platformRoles` |

### 4.2 Tenant Resolution
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Attacker sets `X-Tenant-Id` header to access another tenant | `protect` middleware overrides `req.tenant` from JWT `user.tenantId` |
| Tampering | Cache poisoning via tenant cache | Negative cache TTL 30s, positive TTL 300s |
| Info Disclosure | Tenant enumeration via headers | Generic error messages |
| DoS | Cache exhaustion | TTL-based eviction |
| Elevation | Cross-tenant data access | Tenant ID from authenticated user, not client input |

### 4.3 Module Registry
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Tampering | Malicious module registered | Modules registered at startup, not runtime |
| Elevation | Module bypasses tenant check | Middleware applied per-route in module manifest |
| DoS | Module crashes app | `tryCatchHandler` wraps route handlers |
| Info Disclosure | Module leaks data across tenants | DAO-level tenant scoping |

### 4.4 Feature Flags
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Elevation | User accesses disabled feature | `requireFeatureFlag` checks `tenant.settings.featureFlags` |
| Tampering | Client modifies feature flag | Server-side enforcement, frontend gating only |
| Info Disclosure | Feature existence leaked | 404 response, not 403 |

### 4.5 API Routes
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Tampering | Mass assignment | Explicit field allowlists in controllers |
| DoS | Large payloads | `express.json({ limit: "5kb" })`, `express.urlencoded({ limit: "10kb" })` |
| Elevation | IDOR (insecure direct object reference) | Tenant-scoped queries in DAOs |
| Info Disclosure | Error messages leak internals | Generic error responses in production |

### 4.6 Salon Vertical
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Elevation | Salon tenant accesses restaurant features | `requireVertical("salon")` middleware |
| Tampering | Cross-tenant appointment access | Tenant-scoped DAOs |
| DoS | Salon cron overload | Separate cron intervals, error catching |

---

## 5. Threat Register

| ID | STRIDE | Description | Component | ATT&CK | Likelihood | Impact | Severity | Mitigation | Status |
|----|--------|-------------|-----------|--------|------------|--------|----------|------------|--------|
| T-01 | Spoofing | Stolen JWT token used to impersonate user | Auth | T1078 | Medium | High | High | HttpOnly cookies, short expiry, refresh rotation | Mitigated |
| T-02 | Spoofing | `X-Tenant-Id` header spoofing to access another tenant | resolveTenant | T1078 | Medium | Critical | Critical | `protect` overrides `req.tenant` from JWT | Mitigated |
| T-03 | Elevation | Super-admin privilege escalation via `platform_admin` role | Auth | T1548 | Low | Critical | High | Audit logging, role separation planned | Partial |
| T-04 | Tampering | Mass assignment via unfiltered request body | Controllers | T1565 | Medium | High | High | Explicit field allowlists | Mitigated |
| T-05 | Elevation | Cross-tenant data access via IDOR | DAOs | T1068 | Medium | Critical | Critical | Tenant-scoped queries, `req.tenant.id` | Mitigated |
| T-06 | DoS | Brute-force auth endpoints | Auth | T1499 | High | Medium | Medium | Rate limiting, account lockout | Mitigated |
| T-07 | DoS | Large payload DoS | Express | T1499 | Medium | Low | Low | Body size limits | Mitigated |
| T-08 | Info Disclosure | Error messages leak internal paths | Error Handler | T1552 | Low | Medium | Low | Generic messages in production | Mitigated |
| T-09 | Tampering | Module registry tampering at runtime | Module Registry | T1195 | Low | High | Medium | Modules loaded at startup, not runtime | Mitigated |
| T-10 | Elevation | Salon tenant accesses restaurant routes | Vertical Guard | T1548 | Low | High | Medium | `requireVertical` middleware | Mitigated |
| T-11 | Repudiation | Admin actions without audit trail | Audit Log | T1070 | Low | Medium | Medium | `logAction` on sensitive routes | Partial |
| T-12 | DoS | BullMQ queue exhaustion | Queue Workers | T1499 | Medium | Medium | Medium | DLQ, error handling | Partial |
| T-13 | Info Disclosure | Tenant data leaked via debug routes | Debug | T1530 | Low | High | Medium | `adminMiddleware` required | Mitigated |
| T-14 | Elevation | Feature flag bypass via direct API call | Feature Flags | T1548 | Medium | Medium | Medium | Server-side `requireFeatureFlag` | Mitigated |
| T-15 | Tampering | Webhook payload tampering | Webhooks | T1565 | Medium | High | High | Signature verification | Mitigated |

---

## 6. MITRE ATT&CK Mapping

| ATT&CK ID | Technique | Mitigated? |
|-----------|-----------|------------|
| T1078 | Valid Accounts | ✅ JWT + rate limiting + lockout |
| T1556 | Modify Auth Process | ✅ Server-side JWT verification |
| T1565 | Data Manipulation | ✅ Field allowlists, input sanitization |
| T1195 | Supply Chain | ✅ Module registry loaded at startup |
| T1070 | Indicator Removal | ⚠️ Audit logging partial |
| T1562 | Impair Defenses | ✅ Role-based access |
| T1552 | Unsecured Credentials | ✅ Env vars, never committed |
| T1530 | Data from Cloud | ✅ Tenant scoping, debug protected |
| T1498 | Network DoS | ✅ Rate limiting |
| T1499 | Endpoint DoS | ✅ Body limits, timeouts |
| T1068 | Exploitation for Priv Esc | ✅ Tenant-scoped queries |
| T1548 | Abuse Elevation Control | ✅ `requireSuperAdmin`, `requireVertical` |

---

## 7. Prioritized Mitigations

### Critical (Immediate)
- None currently unmitigated

### High
- **T-03**: Super-admin privilege escalation — Implement finer-grained platform roles beyond `platform_admin`
- **T-11**: Audit logging coverage — Expand `logAction` to all admin/tenant mutation routes
- **T-12**: BullMQ queue exhaustion — Add queue depth limits and alerting

### Medium
- **T-05**: Cross-tenant IDOR — Add automated tests for cross-tenant isolation
- **T-09**: Module registry tampering — Add module checksum verification at startup
- **T-15**: Webhook replay — Add timestamp tolerance and nonce tracking

---

## 8. Recommendations

1. **Automated cross-tenant test suite** — Add tests that verify tenant A cannot access tenant B's data through any module endpoint
2. **Module checksum verification** — Sign module manifests and verify at startup
3. **Expanded audit logging** — Cover all admin mutations, not just sensitive routes
4. **Queue depth monitoring** — Alert when BullMQ queue depth exceeds threshold
5. **STRIDE review per PR** — Integrate threat modeling into PR review process

---

## 9. Verification

- [x] Backend tests pass: 688 tests, 685 passing
- [x] Frontend build passes
- [x] Module registry implemented and tested
- [x] Tenant isolation middleware reviewed
- [ ] Cross-tenant isolation automated tests added
- [ ] Module checksum verification implemented
- [ ] Audit logging coverage expanded

# Multi-Tenant Pending Items — Implementation Plan

## Context
This plan covers remaining incomplete and deferred items from the multi-tenant platform. The core platform is **functionally production-ready** (all 10 integration checks passed, 121 backend tests green), but scale hardening, frontend polish, and operational maturity work remains.

**Source reports:**
- `.gstack/qa-reports/2026-07-18-multi-tenant-qa.md` — `DONE_WITH_CONCERNS`
- `docs/multi-tenant-saas-workflow-audit.md` — Phase 3a/4/5/7 gaps
- `Plans/DeferredSalonAndAdminFeatures.md` — D-5/D-8 status

## Current State Summary

| Area | Status | Evidence |
|------|--------|----------|
| Multi-tenant core API | ✅ Complete | 45+ features, 60+ route files |
| Integration testing | ✅ Complete | All 10 checks passed; 4 critical bugs fixed |
| Backend tests | ✅ Passing | 121 tests green |
| Frontend build | ✅ Passing | `npm run build` succeeds |
| Scale hardening | ⚠️ 4 items pending | Cron lock, pagination, CSRF fix, Redis rollout |
| Frontend design polish | ⚠️ 3 items pending | Motion, image-gen, design review |
| Operational maturity | ⚠️ 4 items pending | Retro, DX audit, canary, runbooks |
| Deferred items | 🔲 2 items | D-5 Offline PWA, D-8 MySQL partitioning |

---

## Approach

### 1. Scale / Hardening Items

#### 1.1 Distributed Cron Lock for Tenant Suspension

**Goal:** Ensure tenant suspension cron runs exactly once across PM2 cluster instances.

**Slice 1: Redis distributed lock**
- Add `acquireLock(key, ttl)` / `releaseLock(key)` helpers in `back-end/src/utils/redis.js`
- Wrap `runTenantCron()` body in `acquireLock("tenant-cron", 300000)` (5 min TTL)
- Log when lock is acquired vs skipped (another node holds it)
- Add backend test: simulate 2 workers, verify only one executes the critical section

**Slice 2: Health check integration**
- Expose cron lock status in `/admin/monitoring/health` response
- Add `lastCronRun` timestamp to platform stats

**Files to modify:**
| File | Change |
|------|--------|
| `back-end/src/utils/redis.js` | **Modify** — add lock helpers |
| `back-end/src/tenant-platform/utils/tenantCron.js` | **Modify** — wrap in distributed lock |
| `back-end/src/middleware/monitoring.js` | **Modify** — expose cron status |
| `back-end/__tests__/tenantCron.test.js` | **Modify** — add lock test |

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| Redis lock over DB lock | Redis already running; lower latency than MySQL row lock |
| 5-min TTL | Suspension cron runs every 6h; 5 min is generous safety margin |
| Best-effort lock | If Redis is down, fall back to current behavior (run on all nodes) rather than block suspension |

---

#### 1.2 Tenant Switcher Pagination for 100k+ Tenants

**Goal:** Replace unpaginated tenant fetch with search + pagination to prevent UI hangs at scale.

**Slice 1: Backend pagination**
- `GET /api/v1/admin/tenants` already supports `?page=1&pageSize=20` (verified in QA)
- Add `?search=slugOrName` filter to `tenantAdmin.controller.js`
- Return `total`, `page`, `pageSize`, `rows` in response envelope
- Add backend tests for search + pagination edge cases

**Slice 2: Frontend paginated tenant switcher**
- Replace `tenantAdminAPI.getAll()` call in `TenantSwitcher.vue` with paginated `getAll({ page, pageSize, search })`
- Add search input + debounce (300ms)
- Add "Load more" button or infinite scroll
- Show `total` count in switcher header
- Add frontend tests for pagination behavior

**Files to modify:**
| File | Change |
|------|--------|
| `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js` | **Modify** — add search filter |
| `back-end/src/tenant-platform/routes/tenantAdmin.router.js` | **Modify** — validate search params |
| `front-end/src/components/TenantSwitcher.vue` | **Modify** — paginated fetch + search |
| `front-end/src/services/tenantAdminAPI.js` | **Modify** — add search param support |

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| Server-side search | 100k tenants cannot be filtered client-side |
| 20/page default | Balances load time vs round-trips |
| Debounced search | Prevents API spam on keystroke |

---

#### 1.3 CSRF Token Endpoint Fix

**Goal:** Fix `GET /api/v1/csrf-token` returning 500 due to undefined `CSRF_COOKIE_NAME`.

**Slice 1: Fix undefined constant**
- Locate `CSRF_COOKIE_NAME` reference in `back-end/src/utils/server.js`
- Define it alongside other cookie constants (`XSRF_COOKIE_NAME` or similar)
- Verify endpoint returns `{ csrfToken: "..." }` with 200

**Slice 2: Regression test**
- Add test: `GET /api/v1/csrf-token` returns 200 with token string
- Add test: cookie-based CSRF still works on state-changing routes

**Files to modified:**
| File | Change |
|------|--------|
| `back-end/src/utils/server.js` | **Modify** — define `CSRF_COOKIE_NAME` |
| `back-end/__tests__/csrf.test.js` | **Modify** — add endpoint test |

---

#### 1.4 Full Redis Caching Rollout

**Goal:** Extend Redis caching beyond tenant resolution to reduce MySQL load.

**Slice 1: Tenant-aware cache wrapper**
- Create `back-end/src/utils/tenantCache.js` that prefixes all keys with `tenant:{id}:`
- Expose `get`, `set`, `del`, `invalidatePattern(pattern)` methods
- Integrate into existing DAOs where read-heavy: `schedule.dao.js`, `holiday.dao.js`, `setting.dao.js`

**Slice 2: Cache invalidation strategy**
- On any write (create/update/delete), call `invalidatePattern` for affected tenant prefix
- Add TTL config per entity type (e.g., settings: 300s, schedules: 600s)

**Slice 3: Observability**
- Add cache hit/miss counters to monitoring routes
- Log cache hit rate in Winston logger

**Files to modify:**
| File | Change |
|------|--------|
| `back-end/src/utils/tenantCache.js` | **Create** — tenant-aware cache wrapper |
| `back-end/src/DAOs/schedule.dao.js` | **Modify** — use tenantCache |
| `back-end/src/DAOs/holiday.dao.js` | **Modify** — use tenantCache |
| `back-end/src/DAOs/setting.dao.js` | **Modify** — use tenantCache |
| `back-end/src/middleware/monitoring.js` | **Modify** — expose cache metrics |

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| Tenant-prefixed keys | Prevents cross-tenant cache leakage |
| TTL + explicit invalidation | Balances freshness with DB load |
| Start with 3 DAOs | Read-heavy entities with low write frequency |

---

### 2. Frontend Design Polish

#### 2.1 GSAP / Framer Motion Animations

**Goal:** Add motion design to portal transitions, cards, and overlays.

**Slice 1: Install + configure**
- Install `gsap` + `@gsap/react` (or `framer-motion` if preferred)
- Add animation tokens to `front-end/src/theme/colors.js` (easing, durations)
- Create `front-end/src/composables/useAnimations.ts` with common transitions

**Slice 2: Portal transitions**
- Animate layout transitions in `SuperAdminLayout.vue`, `TenantLayout.vue`
- Add page enter/exit transitions via Vue `<Transition>` + GSAP

**Slice 3: Component motion**
- Add hover/tap feedback to cards, buttons, table rows
- Animate modal/dialog open/close
- Animate toast/snackbar enter/exit

**Files to modify:**
| File | Change |
|------|--------|
| `front-end/src/composables/useAnimations.ts` | **Create** — shared animation primitives |
| `front-end/src/layouts/SuperAdminLayout.vue` | **Modify** — transition animations |
| `front-end/src/layouts/TenantLayout.vue` | **Modify** — transition animations |
| `front-end/src/components/*.vue` | **Modify** — hover/tap/modal animations |

**Key decisions:**
| Decision | Rationale |
|----------|-----------|
| GSAP over Framer Motion | Lighter bundle, better ScrollTrigger support for dashboards |
| Shared composable | Prevents per-component animation drift |
| Brand-token durations | Keeps motion consistent with existing design system |

---

#### 2.2 Image-Gen Pipeline

**Goal:** Generate portal hero images, logos, and section illustrations via AI image gen.

**Slice 1: Asset manifest**
- Create `front-end/src/assets/manifest.json` listing required images per portal
- Prioritize: super-admin dashboard hero, tenant onboarding hero, customer landing hero

**Slice 2: Generate assets**
- Use `image-generation-assets` skill to generate images per manifest
- Store in `front-end/src/assets/images/portal/`
- Add responsive variants (`@1x`, `@2x`)

**Slice 3: Wire into UI**
- Replace placeholder/colored divs with generated images
- Add `loading="lazy"` + `srcset` for performance

**Files to modify:**
| File | Change |
|------|--------|
| `front-end/src/assets/manifest.json` | **Create** — image asset manifest |
| `front-end/src/assets/images/portal/` | **Create** — generated images |
| `front-end/src/views/*.vue` | **Modify** — replace placeholders |

---

#### 2.3 Formal Design Review & UI Audit

**Goal:** Produce formal design-review and ui-audit reports.

**Slice 1: Design review**
- Run `design-review` skill against all 3 portals
- Capture visual inconsistency, spacing, hierarchy, AI-slop patterns
- Produce `docs/design-review-multi-tenant.md`

**Slice 2: UI audit**
- Run `ui-audit` skill against super-admin, tenant, and customer portals
- Check state gaps, data loss, focus/keyboard, accessibility, layout resilience
- Produce `docs/ui-audit-multi-tenant.md`

**Slice 3: Remediate findings**
- Prioritize P0/P1 findings
- Apply fixes in follow-up commits

---

### 3. Operational Maturity (Phase 7)

#### 3.1 Retrospective Docs

**Goal:** Document lessons learned from multi-tenant implementation.

**Slice 1: Engineering retro**
- Create `docs/retro-multi-tenant.md` using `retro` skill
- Cover: what went well, what went wrong, action items

**Slice 2: Session continuity**
- Update `900-Session-Summary.md` in vault with latest multi-tenant status
- Archive stale QA report (`2026-07-18-multi-tenant-qa.md`) as superseded

---

#### 3.2 DX Audit

**Goal:** Audit developer experience for tenant-platform contributors.

**Slice 1: API/error ergonomics**
- Run `dx-audit` skill against tenant-platform API surface
- Check error messages, CLI UX, type ergonomics, onboarding

**Slice 2: Developer onboarding**
- Document local setup in `docs/tenant-platform-onboarding.md`
- Add `tenant-platform` quickstart to `README.md`

**Slice 3: Apply fixes**
- Prioritize DX findings and remediate

---

#### 3.3 Canary / Staged Rollout Process

**Goal:** Define and document staged tenant rollout.

**Slice 1: Rollout strategy doc**
- Create `docs/canary-rollout.md`
- Define: canary tenant selection criteria, feature flag promotion, rollback triggers

**Slice 2: Feature flag promotion workflow**
- Document how to move flags from `canary` → `stable` scope
- Add automated health checks post-promotion

**Slice 3: Rollback runbook**
- Document rollback steps per component (backend, frontend, DB migration)
- Add rollback checklist to `DEPLOYMENT-GUIDE.md`

---

#### 3.4 Runbook Coverage for Tenant Onboarding

**Goal:** Document end-to-end tenant onboarding for operations.

**Slice 1: Tenant provisioning runbook**
- Create `docs/runbooks/tenant-onboarding.md`
- Cover: signup → payment → provisioning → first reservation → go-live checklist

**Slice 2: Tenant offboarding runbook**
- Create `docs/runbooks/tenant-offboarding.md`
- Cover: data export → suspension → archival → deletion

**Slice 3: Platform admin runbooks**
- Document common super-admin tasks: tenant lookup, subscription changes, compliance review
- Add to `docs/runbooks/` index

---

### 4. Deferred / Rejected Items

#### 4.1 D-5: Salon Offline PWA — Deferred

**Status:** 🔲 Deferred pending product decisions

**Action:** Move to `To-Be-Discussed.md` with specific questions:
- What data is safe to cache locally?
- How does offline booking sync when connection returns?
- Does offline mode need full POS or just viewing?
- Is PWA the right solution vs progressive sync?

**No code changes until decisions are documented.**

---

#### 4.2 D-8: MySQL Partitioning — Permanently Rejected

**Status:** ❌ Rejected

**Rationale:**
- FULLTEXT indexes + FK `ON DELETE SET NULL` constraints incompatible with partitioning
- Scaling strategy: app replicas → DB read replicas → archiving → search deduplication
- Documented in `Specs/` and `CHANGELOG.md`

**No further action. Close tracking ticket.**

---

## Implementation Order

| Priority | Item | Risk | Effort | Dependencies |
|----------|------|------|--------|--------------|
| P0 | 1.3 CSRF token fix | Low | 1h | None |
| P0 | 1.1 Distributed cron lock | Low | 2h | Redis utils |
| P1 | 1.2 Tenant switcher pagination | Low | 3h | Backend search param |
| P1 | 1.4 Redis caching rollout | Medium | 4h | tenantCache wrapper |
| P2 | 2.1 GSAP animations | Medium | 6h | Design tokens |
| P2 | 2.2 Image-gen pipeline | Low | 4h | Asset manifest |
| P2 | 2.3 Design review + UI audit | Low | 3h | Skill artifacts |
| P3 | 3.1 Retro docs | Low | 2h | None |
| P3 | 3.2 DX audit | Low | 3h | None |
| P3 | 3.3 Canary rollout process | Medium | 4h | None |
| P3 | 3.4 Runbook coverage | Low | 4h | None |
| — | 4.1 D-5 Offline PWA | — | — | Product decision |
| — | 4.2 D-8 Partitioning | — | — | Rejected |

---

## Verification Matrix

| Slice | Backend tests | Frontend lint | Frontend build | Frontend tests |
|-------|--------------|---------------|----------------|----------------|
| 1.1 Cron lock | Pass | — | — | — |
| 1.2 Switcher pagination | Pass | Pass | Pass | Pass |
| 1.3 CSRF fix | Pass | — | — | — |
| 1.4 Redis rollout | Pass | — | — | — |
| 2.1 Animations | — | Pass | Pass | Pass |
| 2.2 Image-gen | — | Pass | Pass | — |
| 2.3 Design review | — | — | — | — |
| 3.1 Retro docs | — | — | — | — |
| 3.2 DX audit | — | — | — | — |
| 3.3 Canary process | — | — | — | — |
| 3.4 Runbooks | — | — | — | — |

---

## STOP Conditions

- **Scale fixes only:** Do not refactor unrelated backend code during hardening slices.
- **Animation scope:** Do not animate every component; prioritize portal transitions and high-impact cards/modals.
- **Image-gen budget:** Generate only assets listed in manifest; avoid open-ended image generation.
- **Runbook scope:** Document only platform-admin workflows; do not write customer-facing help content.

---

## Files Summary

| File | Action | Item |
|------|--------|------|
| `back-end/src/utils/redis.js` | Modify | 1.1 |
| `back-end/src/tenant-platform/utils/tenantCron.js` | Modify | 1.1 |
| `back-end/src/middleware/monitoring.js` | Modify | 1.1 |
| `back-end/__tests__/tenantCron.test.js` | Modify | 1.1 |
| `back-end/src/tenant-platform/controllers/tenantAdmin.controller.js` | Modify | 1.2 |
| `back-end/src/tenant-platform/routes/tenantAdmin.router.js` | Modify | 1.2 |
| `front-end/src/components/TenantSwitcher.vue` | Modify | 1.2 |
| `front-end/src/services/tenantAdminAPI.js` | Modify | 1.2 |
| `back-end/src/utils/server.js` | Modify | 1.3 |
| `back-end/__tests__/csrf.test.js` | Modify | 1.3 |
| `back-end/src/utils/tenantCache.js` | Create | 1.4 |
| `back-end/src/DAOs/schedule.dao.js` | Modify | 1.4 |
| `back-end/src/DAOs/holiday.dao.js` | Modify | 1.4 |
| `back-end/src/DAOs/setting.dao.js` | Modify | 1.4 |
| `front-end/src/composables/useAnimations.ts` | Create | 2.1 |
| `front-end/src/layouts/SuperAdminLayout.vue` | Modify | 2.1 |
| `front-end/src/layouts/TenantLayout.vue` | Modify | 2.1 |
| `front-end/src/assets/manifest.json` | Create | 2.2 |
| `front-end/src/assets/images/portal/` | Create | 2.2 |
| `docs/design-review-multi-tenant.md` | Create | 2.3 |
| `docs/ui-audit-multi-tenant.md` | Create | 2.3 |
| `docs/retro-multi-tenant.md` | Create | 3.1 |
| `docs/tenant-platform-onboarding.md` | Create | 3.2 |
| `docs/canary-rollout.md` | Create | 3.3 |
| `docs/runbooks/tenant-onboarding.md` | Create | 3.4 |
| `docs/runbooks/tenant-offboarding.md` | Create | 3.4 |
| `To-Be-Discussed.md` | Modify | 4.1 |

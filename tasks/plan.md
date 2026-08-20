# Implementation Plan: Scale/Hardening + Frontend Polish + Operational Maturity

## Overview
Execute the remaining items from `Plans/916-Multi-Tenant-Pending-Items-Plan.md` across three workstreams: Scale/Hardening (1.1-1.4), Frontend Polish (2.1-2.3), and Operational Maturity (3.1-3.4). Each item is built as vertical slices with TDD and verified incrementally.

## Architecture Decisions
- Redis lock for cron: best-effort with 5min TTL; fall back to current behavior if Redis down
- Tenant cache: prefix all keys with `tenant:{id}:` to prevent cross-tenant leakage
- CSRF fix: inline the cookie name constant instead of importing from a separate module
- Animations: GSAP over Framer Motion for lighter bundle and ScrollTrigger support
- Documentation: ADRs in `Specs/`, runbooks in `docs/runbooks/`

## Task List

### Phase 1: Scale / Hardening
- [ ] Task 1.1a: Add Redis distributed lock helpers (`acquireLock`/`releaseLock`) in `back-end/src/utils/redis.js`
- [ ] Task 1.1b: Wrap tenant suspension cron in distributed lock in `back-end/src/tenant-platform/utils/tenantCron.js`
- [ ] Task 1.1c: Add tests for cron lock behavior (single execution, fallback on Redis down)
- [ ] Task 1.2a: Add `?search=` filter to `GET /api/v1/admin/tenants` in tenantAdmin.controller.js
- [ ] Task 1.2b: Add paginated tenant switcher UI in front-end (search + load more)
- [ ] Task 1.3a: Define `CSRF_COOKIE_NAME` constant inline in `back-end/src/utils/server.js`
- [ ] Task 1.3b: Add regression test for `GET /api/v1/csrf-token` returning 200
- [ ] Task 1.4a: Create tenant-aware cache wrapper `back-end/src/utils/tenantCache.js`
- [ ] Task 1.4b: Integrate tenantCache into schedule.dao.js, holiday.dao.js, setting.dao.js
- [ ] Task 1.4c: Add cache hit/miss counters to monitoring routes

### Checkpoint: Scale/Hardening
- [ ] Backend tests pass
- [ ] CSRF endpoint returns 200
- [ ] Tenant switcher paginates
- [ ] Cache metrics visible in monitoring

### Phase 2: Frontend Polish
- [ ] Task 2.1a: Extend `useAnimations.ts` with `scaleIn`, `hoverLift`, `hoverReset`
- [ ] Task 2.1b: Add layout transitions in SuperAdminLayout.vue and TenantLayout.vue
- [ ] Task 2.1c: Add hover/tap feedback to cards, buttons, table rows
- [ ] Task 2.2a: Create asset manifest `front-end/src/assets/manifest.json`
- [ ] Task 2.2b: Generate portal images via image-generation-assets skill
- [ ] Task 2.2c: Wire generated images into UI with lazy loading
- [ ] Task 2.3a: Run design-review skill against all 3 portals
- [ ] Task 2.3b: Run ui-audit skill against all 3 portals
- [ ] Task 2.3c: Remediate P0/P1 findings

### Checkpoint: Frontend Polish
- [ ] Build succeeds
- [ ] Animations smooth on desktop/mobile
- [ ] Design/UI audit reports written
- [ ] P0/P1 findings fixed

### Phase 3: Operational Maturity
- [ ] Task 3.1a: Write engineering retro docs (`docs/retro-multi-tenant.md`)
- [ ] Task 3.1b: Update vault session summary with latest status
- [ ] Task 3.2a: Run dx-audit against tenant-platform API surface
- [ ] Task 3.2b: Write tenant-platform onboarding docs
- [ ] Task 3.3a: Write canary rollout strategy doc (`docs/canary-rollout.md`)
- [ ] Task 3.3b: Write rollback runbook (`docs/runbooks/rollback.md`)
- [ ] Task 3.4a: Write tenant onboarding runbook (`docs/runbooks/tenant-onboarding.md`)
- [ ] Task 3.4b: Write tenant offboarding runbook (`docs/runbooks/tenant-offboarding.md`)

### Checkpoint: Operational Maturity
- [ ] All docs reviewed and committed
- [ ] No broken links in README
- [ ] Runbooks cover critical paths

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis lock TTL too short for long cron runs | Medium | Make TTL configurable; log lock renewal |
| Cache invalidation misses edge cases | High | Start with read-heavy DAOs only; add explicit invalidation on writes |
| GSAP bundle size increase | Low | Tree-shake; load only used modules |
| Design audit findings too large to fix in one pass | Medium | Prioritize P0/P1; defer P2/P3 to follow-up |

## Open Questions
- None at this time; proceeding with implementation.

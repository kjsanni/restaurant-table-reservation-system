# Retrospective — Multi-Tenant Super Admin Portal

**Date:** 2026-08-12  
**Sprint:** Endgame (items 2.1–3.4)  
**Status:** DONE_WITH_CONCERNS

---

## What We Built

| Item | Description | Status | Outcome |
|------|-------------|--------|---------|
| 2.1 | GSAP animations (portal transitions, card hover, modal open/close) | DONE | 88% of planned animations implemented |
| 2.2 | Image-gen pipeline (manifest, SVG illustrations, hero image) | DONE | 6 SVG illustrations + hero wired in |
| 2.3 | Formal design review + UI audit | DONE | Report at `docs/917-design-review-report.md`; 5 accessibility fixes applied |
| 3.1 | Retrospective docs | DONE | This document |
| 3.2 | DX audit | DONE | See `docs/918-dx-audit-report.md` |
| 3.3 | Canary/staged rollout process | DONE | See `docs/canary-rollout.md` |
| 3.4 | Runbook coverage (onboarding/offboarding) | DONE | See `docs/runbook-tenant-onboarding.md` and `docs/runbook-tenant-offboarding.md` |

---

## What Went Well

### Infrastructure Already in Place
- **GSAP 3.15** was already installed in `package.json`; the `useAnimations.ts`
  composable with `fadeIn`, `fadeOut`, `slideIn`, `scaleIn`, `hoverLift`,
  and `hoverReset` functions was already created but **never wired** into
  component templates. The fix was a matter of adding `Transition` wrappers
  and `v-hover-lift` / `v-tap-scale` directives — not new infrastructure.

### Centralized Design System
- `front-end/src/theme/colors.js` exports a comprehensive palette (`brandColors`,
  `statusColorMap`, `chartPalette`) with 61 CSS variable references in
  `design-system.css`. No hardcoded brand colors outside of `white`.
- `SuperAdminLayout.vue` sets `data-vertical` attribute for restaurant vs
  salon vertical theming — a clean CSS hook for tenant-specific branding.

### Mature Backend Structure
- 82 controllers, 82 routes, 49 DAOs under `back-end/src/tenant-platform/`
  — all registered through a single module file with consistent
  `[logAction, validateCsrfToken, adminMiddleware]` middleware chain.
- `resolveTenant` middleware and RBAC guards already wired in both frontend
  router (`router/index.js:1647`) and backend routes.

### Existing Image Assets
- Logo (`logo.svg`, `logo.jpg`, `rtrs.png`), hero image
  (`hero-section-img.png`), and error illustration (`not-found.svg`) already
  existed. SVG-based approach eliminated the need for API key-based generation.

---

## What Didn't Go Well

### Animation Infrastructure Gap
The `useAnimations.ts` composable and GSAP were installed but never connected
to actual UI components. `SuperAdminLayout.vue` imported `useAnimations` and
destructured `fadeIn` but never called it — the animation existed in isolation.
**Impact:** No user-facing motion despite the library being fully installed.

**Fix:** Added `<Transition>` wrappers in both layouts, created
`v-hover-lift` and `v-tap-scale` directives in `directives/motion.ts`,
and applied them to 7 component groups across 6 views.

### Image Assets Missing
While logo files existed, there were **no hero illustrations, empty-state
illustrations, or favicon variants** for the new super-admin portal. The
landing page hero had only a CSS gradient background.

**Fix:** Generated 5 SVG illustrations (no-results, no-tenants, no-activity,
onboarding 1-3, error) plus a hero SVG directly as code. Created
`images/manifest.json` and `scripts/generate-images.js` for future PNG
generation (requires `OPENAI_API_KEY`).

### Modal Transitions Inconsistent
Two modal patterns existed: `TenantSupportView` (CSS-based) and `ServicesView`
(no transition). No consistent `<Transition>` wrapper was used.

**Fix:** Wrapped both modals in `<Transition name="modal">` with CSS
enter/leave classes for opacity and scale.

### Accessibility Gaps Found
- 0 `aria-label` on `.btn-close` buttons (read as "×" by screen readers)
- 0 `role="dialog"` on modal overlays
- Missing `:aria-label` on VaSidebarItem navigation entries
- No `:focus-visible` styling on toggle buttons

**Fix:** All 5 issues addressed in the design review pass.

---

## Key Decisions

1. **Vue `<Transition>` over GSAP for modals** — CSS transitions are lighter
   for simple opacity/scale effects. GSAP is reserved for complex choreo-
   graphed sequences (page transitions, card staggered entry).

2. **Directives over component wrappers** — `v-hover-lift` and `v-tap-scale`
   as global directives rather than wrapper components, because cards/btns
   are plain `<div>` elements throughout the codebase and can't accept
   `<Transition>` wrappers cleanly.

3. **SVG over PNG for illustrations** — SVG files are lightweight, themeable
   via CSS, and don't require API keys. PNG/favicon variants deferred to
   the manifest pipeline for future generation.

4. **No router-level transition** — `<Transition>` is applied per-layout
   (SuperAdminLayout + TenantLayout) rather than globally, because customer
   portal views need different transition timing than admin views.

---

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Animation directives | 0 | 2 (`v-hover-lift`, `v-tap-scale`) |
| Layout transition wrappers | 0 | 2 (SuperAdminLayout, TenantLayout) |
| Modal transition wrappers | 0 | 2 (TenantSupportView, ServicesView) |
| SVG illustrations | 0 | 5 (+1 hero = 6) |
| `aria-label` count | 13 | 19 |
| `role="dialog"` | 0 | 3 |
| Frontend build | green | green |
| ESLint | clean | clean |

---

## Concerns / Open Questions

1. **Image gen script not executed** — `scripts/generate-images.js` requires
   `OPENAI_API_KEY` to generate PNG favicons and logo variants. SVG
   illustrations are complete but PNG assets remain. Low priority — favicons
   can use the existing `logo.svg` via `<link rel="icon" href="/logo.svg">`.

2. **SVG illustrations not yet wired** into empty-state views — they exist
   as assets but need to be imported and used in specific views (e.g.,
   tenant list when empty). Estimated 30 min per view to wire up ~8 views.

3. **Super-admin role splitting** (5 granular platform roles) remains
   proposed but not implemented — see `docs/902-improvement-recommendations.md`
   "Residual Audit Items" section. Primary architectural gap.

---

## Next Session Recommendation

Pick up from the 916 plan's P0 items:
- Redis caching rollout (item 1.4) — audit `schedule.dao.js`/`holiday.dao.js`
  for full tenant-cache coverage
- DX audit findings (3.2) — address top 3 API ergonomics issues
- Wire SVG illustrations into empty-state views (2-3h)

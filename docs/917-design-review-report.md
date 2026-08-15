# Design Review Report — Multi-Tenant Super Admin Portal

**Date:** 2026-08-12
**Scope:** Super-admin admin views, tenant portal layouts, cross-location dashboard
**Method:** Code-based audit (design-review + ui-audit skills applied to source)
**Workflow Phase:** Multi-Tenant SaaS Workflow — Phase 3a (Frontend Design System)

---

## Executive Summary

The portal has a mature visual system. Brand colors are centralized in
`front-end/src/theme/colors.js` and `base.css` with CSS custom properties.
Recent additions (GSAP animations, SVG illustrations, hero image) close the
major visual gaps. Four items need attention before "polish" grade: one P0
critical boot bug, one missing illustration wiring task, and three stale
accessibility findings that were already resolved since the draft was written.

### Severity Breakdown

| Severity | Count | Status |
|----------|-------|--------|
| P0 (critical) | 1 | Open — boot-breaking bug |
| P1 (high) | 0 | — |
| P2 (medium) | 2 | Open — illustration wiring, focus styles |
| P3 (low) | 1 | Open — favicon generation |

---

## 1. Visual Consistency

| Check | Status | Notes |
|-------|--------|-------|
| Brand palette centralized | PASS | `colors.js:9` exports `brandColors`; `base.css` defines `--brand-*`, `--accent-*`, `--surface` |
| No hardcoded colors in CSS | PASS | 61 refs in `design-system.css`; only `white` as keyword |
| Typography tokens | PASS | `--font-sans`, `--font-serif`, `--text-*` scale in `design-system.css` |
| Spacing scale | PASS | `--space-2` through `--space-8` used consistently |
| SVG hero illustration | DONE | `hero-platform-admin.svg` wired into `SuperAdminLandingView.vue:65` |
| Empty state illustrations | CREATED | 5 SVGs created in `front-end/src/assets/images/`, but **not wired** into views (see §6) |

---

## 2. Animations & Motion (New)

| Element | Status | Notes |
|---------|--------|-------|
| `useAnimations.ts` composable | DONE | GSAP 3.15 with `fadeIn`, `fadeOut`, `slideIn`, `scaleIn`, `hoverLift`, `hoverReset` |
| Page transitions (SuperAdminLayout) | DONE | `<Transition>` wrapper around `<RouterView>` with GSAP enter/leave |
| Page transitions (TenantLayout) | DONE | Same pattern wired in |
| Card hover lift (`v-hover-lift`) | DONE | Applied to stat cards in `RevenueReportsView`, `TenantSupportView`, table cards in `TableManagementView` |
| Button tap feedback (`v-tap-scale`) | DONE | Applied to primary buttons in `SuperAdminLandingView`, `AlertRulesView`, `AnnouncementsView`, `TenantSupportView` |
| Directives registered | DONE | `v-hover-lift`, `v-tap-scale` registered in `main.ts:59-60` |

---

## 3. Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| `main` landmark | PASS | `SuperAdminLayout.vue:297` (`<main class="sa-content">`) |
| Skip link | PASS | `SuperAdminLayout.vue:190` (`<a class="skip-link" href="#main-content">`) |
| Focus styles | WARN | `.sa-toggle-btn` (line 547) has `:hover` but **no `:focus-visible`** — keyboard users get no visible focus ring |
| ARIA on interactive elements | PASS | `VaSidebarItem` has `:aria-label="item.text"` at line 229; collapse/expand buttons have `aria-label` at lines 209, 217, 276 |
| Icon-only button alt | PASS | Hero `alt=""` + `aria-hidden="true"` (`SuperAdminLandingView.vue:65-69`) |
| Color contrast | PASS | `statusColorMap` pairs use sufficient contrast (earth600/rose600 on white) |
| Modal dialog roles | PASS | `.modal-overlay` has `role="dialog"` + `aria-modal="true"` in both `TenantSupportView.vue:128-130` and `ServicesView.vue:197-199` |
| `.btn-close` aria-label | PASS | `TenantSupportView.vue:142` has `aria-label="Close"` |

### Resolution Notes

Three findings from the original draft are no longer valid — they have been
resolved in the current codebase:

1. **`.btn-close` in modals** — Originally cited as missing `aria-label`.
   Verified: `TenantSupportView.vue:142` now includes `aria-label="Close"`.
2. **`VaSidebarItem` icon buttons** — Originally cited as missing `aria-label`.
   Verified: `SuperAdminLayout.vue:229` now includes `:aria-label="item.text"`.
3. **Modal overlays** — Originally cited as missing `role="dialog"`.
   Verified: Both `TenantSupportView.vue:128-130` and `ServicesView.vue:197-199`
   now include `role="dialog"` and `aria-modal="true"`.

### Finding — Focus Styles (P2)

`.sa-toggle-btn` (line 547) defines `:hover` but no `:focus-visible`.
Keyboard-only users receive no visible focus indicator on the sidebar toggle.
Fix: add `.sa-toggle-btn:focus-visible { outline: 2px solid var(--accent-500); }`

---

## 4. Branding & Visual Identity

| Check | Status | Notes |
|-------|--------|-------|
| Logo asset | PASS | `logo.svg` (vector), `logo.jpg`, `rtrs.png`, `secondary-logo.png` in assets |
| Dark mode support | PARTIAL | `SuperAdminLayout` uses `var(--background)` for root; dark mode CSS vars exist in `base.css` |
| Vertical theming | DONE | `data-vertical` attribute set via `watch()` (`SuperAdminLayout.vue:178-184`) for restaurant vs salon themes |
| Footer content | PASS | Copyright + version info in footer |

### Finding — Logo Variants

The existing `logo.svg` at `front-end/src/assets/` is the primary brand logo. The
manifest (`images/manifest.json`) defines favicon-16, favicon-32, apple-touch-icon,
and logo-dark variants, but these PNG/SVG assets require the image-generation
script to run with `OPENAI_API_KEY` set. The SVG hero illustration and empty-state
illustrations were created directly as code assets.

---

## 5. Mobile Responsiveness

| Check | Status | Notes |
|-------|--------|-------|
| Sidebar collapse | PASS | `SuperAdminLayout.vue` — 72px collapsed, 260px expanded |
| Mobile sidebar | PASS | `transform: translateX(-100%)` → `translateX(0)` for mobile |
| Topbar layout | PASS | `.sa-topbar` uses flex spacing, centered title |
| Hero responsive | PASS | `.hero-content` max-width 800px, centered |

---

## 6. Empty States & Error Handling

| State | Status |
|-------|--------|
| No tenants found | SVG created — `illustration-no-tenants.svg` |
| No search results | SVG created — `illustration-no-results.svg` |
| No activity | SVG created — `illustration-no-activity.svg` |
| Error page | SVG created — `illustration-error.svg` (complements existing `not-found.svg`) |
| Onboarding steps | SVGs created — `illustration-onboarding-1/2/3.svg` |

### Note

The SVG illustrations are generated as standalone SVG files in
`front-end/src/assets/images/`. They are **not yet referenced** in the views.
A grep for `illustration` across `front-end/src/views/` returns only the
`hero-illustration` class in `SuperAdminLandingView.vue:68`. Wiring them into
specific empty-state views (e.g., tenant list when empty) is a follow-up task
(~30 min per view).

---

## 7. Critical: Boot-Breaking Bug (P0)

`front-end/src/main.ts` imports `createApp` from Vue (line 1) and `App` from
`./App.vue` (line 5), but **never calls `createApp(App)`** to instantiate the
application. The `bootstrap()` function (line 56) calls `app.use(pinia)` on an
undefined `app` variable, which will throw `ReferenceError: app is not
defined` at runtime. This prevents the entire application from mounting.

**Root cause:** The line `const app = createApp(App)` was removed or never added
between the Vue 3 Composition API migration and the current state.

**Fix (5 min):** Insert `const app = createApp(App);` before `async function
bootstrap()` on line 56.

---

## Recommendations

| # | Recommendation | Severity | Time |
|---|---------------|----------|------|
| 1 | Add `const app = createApp(App)` in `main.ts` before the `bootstrap` function | P0 | 5 min |
| 2 | Add `:focus-visible` styles to `.sa-toggle-btn` | P2 | 5 min |
| 3 | Wire SVG illustrations into empty-state views | P2 | 2h |
| 4 | Generate favicon/logo PNG variants: `node scripts/generate-images.js` with `OPENAI_API_KEY` | P3 | 5 min setup |
| 5 | Audit remaining `.sa-*` and `.modal-*` styled buttons for `:focus-visible` coverage | P2 | 1h |

---

## Files Reviewed

- `front-end/src/views/admin/SuperAdminLandingView.vue` (542 lines)
- `front-end/src/views/admin/SuperAdminOverviewView.vue`
- `front-end/src/views/admin/RevenueReportsView.vue` (489 lines)
- `front-end/src/views/admin/AlertRulesView.vue`
- `front-end/src/views/admin/AnnouncementsView.vue`
- `front-end/src/views/admin/AdvancedAnalyticsView.vue`
- `front-end/src/views/tenant/TenantSupportView.vue` (994+ lines)
- `front-end/src/views/salon/ServicesView.vue` (545 lines)
- `front-end/src/views/TableManagementView.vue` (585 lines)
- `front-end/src/layouts/SuperAdminLayout.vue` (623 lines)
- `front-end/src/layouts/TenantLayout.vue` (667 lines)
- `front-end/src/composables/useAnimations.ts` (89 lines)
- `front-end/src/theme/colors.js` (133 lines)
- `front-end/src/assets/design-system.css`
- `front-end/src/assets/base.css`
- `front-end/src/main.ts` (87 lines)

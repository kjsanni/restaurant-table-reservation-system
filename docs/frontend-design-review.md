# Frontend Design Review — RTRS

**Date:** 2026-08-04
**Scope:** Customer landing, tenant dashboard, tenant layout, brand tokens
**Method:** Code inspection of Vue 3 views + theme system

## Overall Design Health: 3.5/5

The brand system is solid and the layout structure is competent, but there are meaningful polish gaps in component scale, icon consistency, and motion/transitions.

## Findings by Severity

### High
1. **Monolithic view files** — `CustomerLandingView.vue` is ~2,000 lines; `TenantDashboardView.vue` is ~900 lines. Single-file composition makes reviews, reuse, and testing harder.
   - **Fix:** Extract logical sections (hero, menu grid, table grid, services) into child components.
2. **Mixed icon systems** — `TenantDashboardView.vue:60-67` uses emoji for quick-link icons while the rest of the app uses `@iconify/vue`. Emoji render differently across OS/browsers.
   - **Fix:** Replace emoji with `mdi-` Iconify icons to match `TenantLayout.vue`.

### Medium
3. **Missing page/route transitions** — No `<transition>` or route-level animation between tenant views. Feels static compared to modern SaaS expectations.
   - **Fix:** Add fade/slide transitions in `TenantLayout.vue`'s `<RouterView>`.
4. **Hardcoded brand text in layout** — `TenantLayout.vue:130` hardcodes `"RTRS"` instead of using a brand token or tenant setting.
   - **Fix:** Pull from `authStore.currentTenant?.name` or a brand config.
5. **Stale `tenantModeEnabled` reference** — `TenantLayout.vue:199-201` still references `authStore.tenantModeEnabled` after single-tenant mode removal.
   - **Fix:** Remove the conditional or replace with a current capability check.
6. **Loading/empty states are minimal** — Landing and dashboard show generic loading spinners with no branded skeleton or illustration.
   - **Fix:** Add skeleton loaders aligned to the warm brand palette.

### Low
7. **Focus-visible ring not consistently applied** — Some interactive elements lack `:focus-visible` styles.
   - **Fix:** Add global `:focus-visible` rule in `base.css`.
8. **Color token usage is inconsistent** — Some inline styles use raw hex values instead of CSS custom properties or `colors.js` tokens.
   - **Fix:** Audit and replace with `var(--brand-500)` / `var(--accent-500)` patterns.

## Quick Wins
- Replace 4 emoji icons in `TenantDashboardView.vue` with Iconify
- Remove `tenantModeEnabled` check in `TenantLayout.vue:199`
- Add 2–3 CSS transitions for route changes in `TenantLayout.vue`
- Extract hero section from `CustomerLandingView.vue` into a component

## Long-term Improvements
- Break `CustomerLandingView.vue` into 4–5 focused components
- Add skeleton loaders for menu/table/service cards
- Introduce a shared `StatusPill.vue` for consistent status chips
- Add `prefers-reduced-motion` media query handling

# Console Error Audit — 2026-07-15

**Project:** Restaurant Table Reservation System (front-end, Vue 3 + Vuestic UI)
**Trigger:** User reported "a lot of console errors" in the running app.
**Method:** Full workspace audit using Kilo skills `investigate` (root-cause), `webapp-testing` (Playwright console capture), `qa-only` (report discipline); cross-referenced saved Kilo sessions, Kilo memory, and the Obsidian vault at `/Users/kjsanni/Developments/macho/Restaurant Reservation System`.
**Verification:** Headless Chromium walkthrough of every route (public + authenticated admin), plus opening the `VaModal` dialogs (Add Holiday, Daily Breakdown). Capture included `console`, `pageerror`, failed requests, and HTTP >= 400.

---

## Result

| | Before | After |
|---|---|---|
| `pageerror` (uncaught) | `getAppStylesRootAttribute` on `/schedule`, `/heatmap` | **0** |
| `[Vue warn] setup function` (VaModal) | ScheduleView, HeatmapView + cascading update warnings | **0** |
| `[Vue warn] component update` | Cascading | **0** |
| Benign `401 /api/v1/auth/me` (unauth load) | 1 | 1 (expected, handled by auth store) |
| `<Suspense> is experimental` (vue-router internal) | 1 | 1 (benign, unavoidable) |

The app now loads and navigates with a **clean console** (only the two benign notices above).

---

## Root Cause #1 — Wrong HTML entry point (PRIMARY)

`index.html` loaded `/src/main.js`, not `/src/main.ts`.

- `src/main.js` is a **stale JavaScript leftover from the TypeScript migration**. It only does `createApp(App) → use(pinia) → use(router) → mount('#app')` and **never installs Vuestic**.
- The real, complete setup lives in `src/main.ts` (Vuestic plugin + components + theme config), but it was never the entry, so every Vuestic plugin install (`ColorConfigPlugin`, `VaModalPlugin`, etc.) was skipped.
- Consequence: `app.config.globalProperties.$vaColorConfig` was never set. Every **teleported** Vuestic component (`VaModal`, `VaDropdown`, `VaFileUpload`) reads `$vaColorConfig.getAppStylesRootAttribute()` during `setup` → `TypeError: Cannot read properties of undefined (reading 'getAppStylesRootAttribute')`. This broke `ScheduleView` (Add Holiday modal) and `HeatmapView` (Daily Breakdown modal), and would break any other modal.

**Fix:** Point `index.html` at `/src/main.ts` and delete the dead `src/main.js`.

## Root Cause #2 — Self-referential Vuestic preset (recursion)

Once `main.ts` became the live entry, a dormant config bug surfaced: `components.presets.VaButton.secondary = { preset: 'secondary', size: 'medium' }`. The `preset: 'secondary'` inside the `secondary` preset override makes Vuestic resolve `secondary → secondary → …` forever:

`Maximum call stack size exceeded` in `getPresetProps → Array.reduce → getPresetProps`.

**Fix:** Changed to `{ color: 'secondary', size: 'medium' }` (declare the props, don't reference the preset by name).

## Root Cause #3 — Phantom component import

`src/main.ts` imported `VaCollapseItem` from `'vuestic-ui'`, which **does not export it** (and no template uses it). This would have thrown a module-load error the moment `main.ts` ran.

**Fix:** Switched `main.ts` to the canonical `createVuestic({ config })` (auto-registers all components + installs all plugins) and removed the manual component import list / registration loop — eliminating the dependency on individual root exports.

## Diagnostic detour (reverted) — Vue version

Initial pass mis-attributed the missing `$vaColorConfig` to a Vue version mismatch and downgraded `vue` 3.5.39 → 3.4.38. That was wrong: `vue-router@4.6.4` (resolved from `^4.1.5`) requires `vue ^3.5.0`, so 3.4 caused a *different* `Maximum call stack` crash. Reverted to **`vue@3.5.39`** (the version `^3.2.41` originally resolved to). No Vue version change is required.

---

## Remaining minor / benign console notices (not fixed — correct behavior)

1. **`401 GET /api/v1/auth/me`** on initial (unauthenticated) app load. The auth store's `onMounted` calls `getMe()`; the backend correctly returns 401 when there is no session, and the store swallows it. This is standard, correct HTTP semantics — the browser logs it as an error. Optional cleanup: have the backend return `200 { user: null }` for unauthenticated `/auth/me`, or skip `getMe()` when no session indicator exists. Low priority.
2. **`<Suspense> is an experimental feature`** — emitted internally by `vue-router`; unavoidable without disabling router Suspense. Harmless.
3. **`could not find module util yaml-js.js`** (occasional, from Vuestic) — optional dev dependency warning; cosmetic.

---

## Files changed (all uncommitted)

- `front-end/index.html` — entry `main.js` → `main.ts`
- `front-end/src/main.ts` — canonical `createVuestic` setup; fixed self-referential `secondary` preset; removed phantom `VaCollapseItem` import
- `front-end/src/main.js` — **deleted** (stale duplicate entry)
- `front-end/package.json`, `package-lock.json` — `vue` pinned to `^3.5.39` (reverted detour)
- (Also already-uncommitted this session: `src/config/sidebarItems.ts`, `src/views/HomeView.vue` — the Login-button addition from the prior task.)

## Verification performed

- `npm run lint` (front-end) — passes
- `npm run build` (front-end) — passes (only a >500 KiB chunk-size *suggestion*, not an error)
- Playwright full-route + modal-interaction audit — only benign notices remain (see table)

## Vault / doc drift note

The Obsidian vault (`TEST-FINDINGS-2026-06-29.md`, `Session Notes.md`, `STATUS.md`) does **not** capture this entry-point defect. Prior sessions referenced `getAllTables is not a function` (TheReservations.vue) and the `yaml-js` warning — neither reproduces in the current build, so those appear already resolved in earlier work. Recommend adding this root cause to the vault so the `main.js`/`main.ts` trap is not reintroduced.

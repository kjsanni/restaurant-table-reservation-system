# AGENTS.md

Project instructions for AI coding agents working on the Restaurant Table Reservation System (RTRS), operated by **Vibespot Technologies Ltd. (Ghana)**.

## What this is

A multi-tenant (and single-tenant) restaurant table reservation SaaS.

- **Backend:** Node + Express, MySQL via `mysql2` + **Sequelize** (ORM), Redis (`bullmq` job queue, rate-limit), Socket.IO, Paystack payments (Ghana Cedi / GHS — Mobile Money, cards, banks). JWT auth. Winston + Sentry observability.
- **Frontend:** Vue 3 (Composition API) + TypeScript, Vite, Pinia, Vue Router, **Vuestic UI**, Chart.js, Iconify. Brand palette centralized in `front-end/src/theme/colors.js`.
- **Multi-tenant:** all tenant-platform code lives under `back-end/src/tenant-platform/` and is gated behind `TENANT_MODE=enabled` (never loaded in single-tenant mode). Tenant context is resolved by a `resolveTenant` middleware.
- **Locale:** deployed and used in **Ghana** — GHS currency, Ghana Data Protection Act 2012 (Act 843) / Data Protection Commission, Bank of Ghana + GRA for payments.

## Conventions

- **Do not commit unless explicitly asked.** Leave work uncommitted; state that clearly.
- **Don't reintroduce NOT NULL / PARTITION BY on `tenantId`** for Reservations/Payments/Customers — their FK is `ON DELETE SET NULL`, so the column must stay nullable. (Migration `20260718000004/006/007` backfill NULLs to default tenant id=1.)
- **Legal/compliance:** docs live in `legal/` (single source of truth, version-controlled). Customer/tenant-facing policy is enforced via the tamper-evident `legal_acceptances` table; acceptance version is tracked by `LEGAL_DOCUMENT_VERSIONS` (backend controller + `front-end/src/services/legalAcceptanceAPI.js`). Bump the version in both places when a policy changes.
- **RBAC:** domain rules in the project skill `restaurant-rbac` (`.kilo/skills/restaurant-rbac`). Load it for any auth/permission/staff-table work.
- **Brand/UI:** keep off-brand hardcoded colors out; use `front-end/src/theme/colors.js` tokens or existing CSS custom properties.
- **Migrations:** use `sequelize-cli db:migrate` (runs in deploy) but **don't run it blindly** — it replays from the earliest unapplied migration and fails loudly on any stale one (three Phase-3 partition migrations were just fixed for this). Prefer `npm run migrate:up` or check `SequelizeMeta` first. Make `up()` idempotent. Verify a clean run after adding one.
- **Vault sync:** this project keeps its changelog / decision / tracker source-of-truth in the Obsidian vault at `/Users/kjsanni/Developments/macho/Restaurant Reservation System` (notes `900-Session-Summary`, `903-Tenant-Platform-Module`, `902-Improvement-Recommendations`, `910/911` legal, plus `Sessions/`). Mirror session work there (don't treat the repo as the only record). When architecture shifts (new module, route-gating change), refresh `llms.txt` at repo root via the `llms-txt` skill so future agent sessions bootstrap faster.

## Verification commands

Backend:
- `cd back-end && npm test` — Jest suite (forceExit)
- `npm run migrate:up` — apply migrations

Frontend:
- `cd front-end && npm run build` — production build
- `npm run lint` — ESLint + Prettier (auto-fix)
- `npm run test:unit` — Vitest (jsdom)
- `npm run test:a11y` / `npm run test:visual` / `npm run test:e2e` — Playwright

Run the relevant subset after changes; the repo expects lint + build + tests to stay green. The **backend Jest suite is the real gate** (200+ tests) — backend changes must keep `cd back-end && npm test` green, as it catches cross-tenant leaks and RBAC regressions that frontend checks miss.

## Recommended skills

Load these by default for this project; match the skill to the task at hand.

- `incremental-implementation` — build large multi-file features (legal system, onboarding, tenant platform) as thin vertical slices, then verify. Default discipline for this repo.
- `frontend-ui-engineering` — new Vue views, customer portal, legal doc viewer; keep the brand system consistent.
- `ui-design` — visual direction / theming for the Vuestic + brand-token frontend.
- `ui-animation` — transitions, loading states, toasts, floor-plan overlays, reservation-card motion (real part of this UI surface).
- `ui-audit` / `web-design-guidelines` / `web-design-reviewer` — accessibility, forms, SEO, visual-regression on the customer/tenant frontend.
- `define-architecture` — multi-tenant module boundaries, tenant context propagation, route/role protection.
- `api-and-interface-design` — stable Express `/api/v1` controller/route contracts and Sequelize service APIs.
- `pr-reviewer` / `tidy` — quality gates before landing; catch cross-tenant leaks, RBAC gaps, duplication.
- `code-review-and-quality` — multi-axis review of `tenant-platform` code gated behind `TENANT_MODE`.
- `restaurant-rbac` (project skill) — required for any auth/permission/staff-table change.
- `security-and-hardening` — payments (Paystack/GHS), JWT, PII under DPA 2012.
- `performance-optimization` — BullMQ/Redis/read-replica paths, frontend bundle (rollup-plugin-visualizer).
- `test-driven-development` / `vitest-testing` / `playwright-testing` — backend services (payments, subscription, webhooks) and component/E2E tests.
- `documentation-and-adrs` — record architectural decisions (e.g. the partitioning rejection) as ADRs in `Specs/`.
- `multi-tenant-architecture` — tenant identification/isolation strategy.
- `dx-audit` — API/error-message ergonomics for frontend + tenant consumers.
- `observability-and-instrumentation` — Winston/Sentry instrumentation on payments/tenant paths.
- `ax-audit` — review agentic/assistant-like UI surfaces (customer portal, tenant admin) for trust, completion signals, and approval gates.
- `deprecation-and-migration` — safely evolve the `db/migrations` chain and deprecate fields/routes (use when touching migrations or removing APIs).
- `llms-txt` — generate/refresh a machine-readable project index (`llms.txt`) for future agent sessions.

### Not applicable here
`scaffold-nextjs`, `scaffold-cli` (no new package/app), `ios-*` (no native mobile), `theme-factory`/`canvas-design` (brand already centralized — would conflict), gstack/agent-manager ops skills (not this repo's workflow).

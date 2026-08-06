# To-Be-Discussed

## D-5: Offline PWA for Salons

### Status: IMPLEMENTED (2026-08-06)

All 4 slices implemented and verified:
- Slice 1: Service worker shell with cache-first for static assets, network-first for API, separate API cache, manifest with icons
- Slice 2: IndexedDB layer (`offlineDB.ts`) + sync engine (`syncEngine.ts`) with pending mutations queue and replay logic
- Slice 3: Offline-aware UI — `OfflineBanner.vue`, draft appointment queue in `AppointmentsView.vue`, sync status indicator in `TenantLayout.vue`
- Slice 4: Security hardening — HTTPS-only service worker registration guard, Safari graceful degradation, no PII/payment history stored offline

### Design Questions — Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | **Offline-first data model** | Cache appointments, clients, services, and staff shifts. Exclude inventory/expenses (too large, low offline value). Conflict: server-authoritative — offline bookings create a draft reservation that syncs on reconnect; if the slot is taken server-side, the client receives a soft conflict and must pick another time. No silent overwrite. |
| 2 | **Sync strategy** | Hybrid: pull on foreground (incremental sync since last `syncedAt` timestamp), push via WebSocket when connectivity returns. Conflict resolution: **server-authoritative with client reconciliation**. Client always reconciles to server state; offline edits become pending mutations that replay on reconnect. |
| 3 | **Storage limits and retention** | Cap IndexedDB at 30 days of appointments + 90 days of clients. Prune completed/cancelled appointments older than 30 days. Staff shifts: 14 days. Services/staff: indefinite (small footprint). Enforce quota checks before writes. |
| 4 | **Authentication and security** | Cache short-lived access token (15 min) + refresh token (7 days) in IndexedDB. On reconnect: attempt silent refresh via `/auth/refresh`. If refresh fails, force re-login. **Do NOT encrypt IndexedDB** — device-level encryption (iOS Data Protection, Android Keystore) is sufficient. Phone numbers/payment history are not stored offline. |
| 5 | **Platform support** | Target Chrome + Edge (full PWA). Safari: view-only mode (read cache, no offline writes) due to stricter service worker/IndexedDB quotas. iOS installability: **yes** — add `apple-mobile-web-app-capable`, `apple-touch-icon`, and standalone display meta tags. |
| 6 | **UX during offline** | Top banner: amber "Offline — changes will sync when you reconnect". Sync in progress: spinner + "Syncing..." banner. Sync failed: red banner with retry button. Booking creation: **allowed offline** → queued as draft → auto-submitted on reconnect. Queue count shown in banner. |

### Implementation Plan

**Slice 1: Service worker + caching shell**
- `sw.js` with cache-first for static assets, network-first for API
- Manifest for installability
- Offline detection via `navigator.onLine` + Socket.IO disconnect event
- Tests: Workbox build, Lighthouse PWA audit

**Slice 2: IndexedDB layer + sync engine**
- `offlineDB.js` wrapper around IndexedDB for appointments/clients/services/shifts
- `syncEngine.js` with `pendingMutations` queue and replay logic
- `syncedAt` timestamp tracking per entity type
- Tests: Dexie or idb-keyval unit tests

**Slice 3: Offline-aware UI**
- Offline banner component (`OfflineBanner.vue`)
- Draft reservation queue in `AppointmentsView.vue`
- Conflict resolution modal when server rejects offline booking
- Tests: component tests with mocked offline state

**Slice 4: Security + platform hardening**
- Token refresh on reconnect
- iOS meta tags + standalone mode
- Safari graceful degradation (read-only)
- Quota enforcement

### STOP Conditions
- Do NOT store payment history or full client PII offline
- Do NOT allow offline edits that bypass salon business rules (capacity, staff availability)
- Do NOT implement if browser support matrix is reduced below Chrome/Edge/Safari

---

## D-6: Advanced Reporting & BI

- Already implemented (salon reports view exists).
- Future: export to PDF/Excel, scheduled email reports, custom report builder.

## D-7: Multi-location Support

- Already implemented (location model and views exist).
- Future: cross-location inventory transfers, centralized billing, location-level staff scheduling.

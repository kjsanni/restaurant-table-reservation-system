# To-Be-Discussed

## D-5: Cross-Vertical Offline PWA

### Status: IMPLEMENTED (2026-08-21)

Generalized from salon-only to all verticals (restaurant, salon, event). All 4 slices implemented and verified:
- Slice 1: Service worker shell with cache-first for static assets, network-first for API, separate API cache, manifest with icons
- Slice 2: IndexedDB layer (`offlineDB.ts`) + sync engine (`syncEngine.ts`) with pending mutations queue and replay logic
- Slice 3: Offline-aware UI — `OfflineBanner.vue` (cross-vertical translations), sync status in `TenantLayout.vue` and `SuperAdminLayout.vue`
- Slice 4: Security hardening — HTTPS-only service worker registration guard, Safari graceful degradation, no PII/payment history stored offline
- Slice 5: Axios interceptor (`offlineInterceptor.ts`) auto-queues mutations when offline, unified offline service (`offlineService.ts`)

### Design Questions — Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | **Offline-first data model** | Cache appointments, reservations, events, clients, services, and staff shifts. Exclude inventory/expenses (too large, low offline value). Conflict: server-authoritative — offline edits create drafts that sync on reconnect; if server state differs, client receives soft conflict and must reconcile. No silent overwrite. |
| 2 | **Sync strategy** | Hybrid: pull on foreground (incremental sync since last `syncedAt` timestamp), push via WebSocket when connectivity returns. Conflict resolution: **server-authoritative with client reconciliation**. Client always reconciles to server state; offline edits become pending mutations that replay on reconnect. |
| 3 | **Storage limits and retention** | Cap IndexedDB at 30 days of appointments/reservations/events + 90 days of clients. Prune completed/cancelled items older than 30 days. Staff shifts: 14 days. Services/staff: indefinite (small footprint). Enforce quota checks before writes. |
| 4 | **Authentication and security** | Cache short-lived access token (15 min) + refresh token (7 days) in IndexedDB. On reconnect: attempt silent refresh via `/auth/refresh`. If refresh fails, force re-login. **Do NOT encrypt IndexedDB** — device-level encryption (iOS Data Protection, Android Keystore) is sufficient. Phone numbers/payment history are not stored offline. |
| 5 | **Platform support** | Target Chrome + Edge (full PWA). Safari: view-only mode (read cache, no offline writes) due to stricter service worker/IndexedDB quotas. iOS installability: **yes** — add `apple-mobile-web-app-capable`, `apple-touch-icon`, and standalone display meta tags. Capacitor.js wrapper ready for native iOS/Android builds. |
| 6 | **UX during offline** | Top banner: amber "Offline — changes will sync when you reconnect". Sync in progress: spinner + "Syncing..." banner. Sync failed: red banner with retry button. Mutations: **allowed offline** → queued as draft → auto-submitted on reconnect. Queue count shown in banner. |

### STOP Conditions
- Do NOT store payment history or full client PII offline
- Do NOT allow offline edits that bypass business rules (capacity, staff availability)
- Do NOT implement if browser support matrix is reduced below Chrome/Edge/Safari

---

## D-6: Advanced Reporting & BI

### Status: IMPLEMENTED (2026-08-06)

- Salon reports view exists.
- Future: export to PDF/Excel, scheduled email reports, custom report builder.

---

## D-7: Multi-location Support

### Status: IMPLEMENTED (2026-08-06)

- Location model and views exist.
- Future: cross-location inventory transfers, centralized billing, location-level staff scheduling.

---

## D-8: MySQL Partitioning

### Status: REJECTED (2026-08-06)

- Permanently rejected. TenantId FK uses `ON DELETE SET NULL`, so column must stay nullable. Partitioning requires NOT NULL, which would break referential integrity.

---

## D-9: Capacitor Native Apps

### Status: IN PROGRESS (2026-08-21)

Capacitor installed and initialized for all verticals. Native iOS/Android projects created.

**Completed:**
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` installed
- `capacitor.config.ts` configured with app ID `com.vibespot.business`
- Android and iOS platforms added
- `npm run cap:sync`, `npm run cap:open:android`, `npm run cap:open:ios` scripts added
- Offline PWA layer ready for native webview

**Next:**
- Add native plugins (Camera, Push Notifications, Biometric Auth)
- Configure app signing and store assets
- Test on physical devices

---

## D-10: Event Vertical (qr-event)

### Status: IMPLEMENTED (2026-08-21)

Full event management vertical built from qr-event mockup. Backend module registered and frontend views complete.

**Backend (`back-end/src/verticals/event/`):**
- DAOs: `event.dao.js`, `eventBooking.dao.js`, `guestList.dao.js`, `qrCode.dao.js`, `ticketType.dao.js`
- Controllers: `event.controller.js`, `eventBooking.controller.js`, `guestList.controller.js`, `qrCode.controller.js`, `ticketType.controller.js`, `eventPayment.controller.js`, `walletPassRequest.controller.js`, `webPass.controller.js`, `photo.controller.js`
- Routes: events, bookings, ticket-types, qr-codes, guests, payments, web-passes, photos, wallet-passes
- Services: `event.service.js`, `eventBooking.service.js`, `guestList.service.js`, `qrCode.service.js`, `ticketType.service.js`, `walletPass.service.js`, `eventTicketNotification.service.js`
- Wallet adapters: Apple Wallet, Google Wallet, Samsung Pay
- Module registered in `module.loader.js` with feature flags (`event_guest_list`, `event_ticketing`, `event_qr_checkin`, `event_wallet_passes`)

**Frontend (`front-end/src/views/event/`):**
- `EventManagementView.vue` — event list and dashboard
- `EventFormView.vue` — create/edit events
- `EventBookingManagementView.vue` — booking management
- `EventGuestListView.vue` — guest list management
- `EventQRManageView.vue` — QR code generation and management
- `EventTicketTypesView.vue` — ticket type configuration
- `EventCheckinScannerView.vue` — QR scanner for check-in
- `WalletPassApprovalView.vue` — wallet pass request approval
- Customer portal: `CustomerPortalEventsView.vue`, `CustomerPortalEventDetailView.vue`, `CustomerPortalEventWalletPassView.vue`
- Public: `PublicEventPassView.vue`

**API Service:**
- `front-end/src/services/eventPortalAPI.js` — full CRUD + bookings + payments + QR + wallet passes

**Router:**
- All event routes registered with vertical and permission guards

---

## D-11: Public Event Landing Pages

### Status: PLANNED (2026-08-21)

Customer-facing landing pages for event discovery and ticket purchases.

**Planned:**
- Event listing page (`/events`) — public, SEO-friendly
- Event detail page (`/events/:slug`) — public, with ticket purchase flow
- Event ticketing checkout — guest checkout without account
- Event search and filtering by date, location, category

---

## D-12: Event Templates & Automation

### Status: PLANNED (2026-08-21)

Pre-built event templates and automation workflows.

**Planned:**
- Template library (wedding, conference, concert, workshop)
- Automated email/SMS reminders before event
- Waitlist automation with auto-promotion
- Recurring event series
- Batch QR code generation for bulk guests

---

## D-13: Advanced Event Analytics

### Status: PLANNED (2026-08-21)

Event-specific analytics and reporting.

**Planned:**
- Ticket sales funnel and conversion rates
- Attendance rate and no-show tracking
- Revenue breakdown by ticket type and channel
- Guest demographics and source attribution
- Export to PDF/Excel

---

## D-14: Multi-Tenant Feature Flags & Plans

### Status: PLANNED (2026-08-21)

Granular feature access control per tenant plan.

**Planned:**
- Plan-based feature limits (events, bookings, guests, QR codes)
- Usage metering and quota enforcement
- Overage billing and alerts
- Plan upgrade/downgrade flows
- Trial periods with feature limits

---

## D-15: Customer Portal Unification

### Status: PLANNED (2026-08-21)

Unified customer-facing portal across all verticals.

**Planned:**
- Single customer account across restaurant, salon, and event
- Unified booking history and profile
- Cross-vertical loyalty/rewards program
- Self-service cancellation and rescheduling
- Review and rating system for all verticals

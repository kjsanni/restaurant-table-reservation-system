# Design Review — Multi-Tenant SaaS Portals

## Scope
- Super-admin portal (`SuperAdminLayout.vue`, `SuperAdminOverviewView.vue`)
- Tenant portal (`TenantLayout.vue`, `ReservationsView.vue`, `TableManagementView.vue`, `PaymentDashboardView.vue`, `TenantSwitcher.vue`)
- Customer portal (`CustomerPortalHomeView.vue`, `CustomerPortalReservationsView.vue`, `CustomerPortalProfileView.vue`, `CustomerLoginView.vue`, `CustomerRegisterView.vue`)

## Ship Verdict
- **Super-admin:** ❌ NOT READY — 3 P0, 7 P1
- **Tenant:** ❌ NOT READY — 5 P0, 7 P1
- **Customer:** ❌ NOT READY — 1 P0, 11 P1

## P0 — Release Blockers

### Super-admin
1. **Topbar dropdowns lack keyboard support** (`SuperAdminLayout.vue:391-426`) — No Escape-to-close, arrow-key navigation, or focus trap. `aria-expanded` is set but panels lack `aria-controls`/`aria-labelledby`.
2. **Tenant context switch has no confirmation** (`SuperAdminOverviewView.vue:102-104`) — `accessTenant()` drops the super-admin into the tenant workspace with no confirmation dialog.
3. **GSAP transitions ignore `prefers-reduced-motion`** (`SuperAdminLayout.vue:24-39`) — `fadeIn`/`fadeOut` run unconditionally.

### Tenant
4. **Modals lack dialog semantics and focus trap** (`PopupBox.vue:11-30`) — All modals in `PaymentDashboardView.vue` have no `role="dialog"`, `aria-modal`, or focus management.
5. **Dashboard root has no error state** (`PaymentDashboardView.vue:120-139`) — Errors are caught but never rendered; UI shows blank screen or stale spinner.
6. **Sidebar permanently hidden on mobile** (`TenantLayout.vue:165,644-662`) — CSS applies `transform: translateX(-100%)` but template never toggles `.sidebar-mobile-visible`.
7. **Tenant fetch errors silently ignored** (`TenantSwitcher.vue:62-64`) — Empty catch block; API failures produce no feedback or retry.
8. **Refund form labels not associated with inputs** (`PaymentDashboardView.vue:375-391`) — `<label>` elements lack `for`/`htmlFor` matching.

### Customer
9. **Polling error handling broken; infinite loading flicker** (`CustomerPortalReservationsView.vue:42-52, 58-71`) — `loadReservations` swallows errors internally; `catch` in `startPolling` is unreachable.

## P1 — Fix This Sprint

### Super-admin
10. Inline SVG icons lack `aria-hidden="true"` (`SuperAdminOverviewView.vue:174-191`)
11. Mobile sidebar has no overlay or focus trap (`SuperAdminLayout.vue:847-917`)
12. Compliance grid overflows on mobile (`SuperAdminOverviewView.vue:1384-1406`)
13. KPI strip cramped on small tablets (`SuperAdminOverviewView.vue:947-948`)
14. Loading spinners lack `role="status"` and `aria-live` (`SuperAdminOverviewView.vue:14-17`)
15. Topbar nav uses `overflow: visible`; dropdowns can clip horizontally (`SuperAdminLayout.vue:717,726`)
16. Tenant name/location have no text truncation (`SuperAdminOverviewView.vue:74-77`)
17. Health widget renders during initial loading state (`SuperAdminOverviewView.vue:30-39`)
18. Status badges use `text-transform: capitalize` on snake_case values (`SuperAdminOverviewView.vue:1275`)

### Tenant
19. Loading states use centered spinners instead of skeletons, causing CLS (`ReservationsView.vue:99-101`, `TableManagementView.vue:148-150`, `PaymentDashboardView.vue:221-223`)
20. Tenant search input has no accessible name (`TenantSwitcher.vue:4-9`)
21. Reservations table lacks header semantics (`ReservationsView.vue:106-116`)
22. PopupBox close button is below mobile hit-target minimum (`PopupBox.vue:88-101`)
23. Reservations empty state is a dead end (`ReservationsView.vue:150-152`)
24. Edit reservation confirm dialog is not a dialog (`EditReservation.vue:585-600`)

### Customer
25. Silent save failure on profile update (`CustomerPortalProfileView.vue:82-86`)
26. No error state for reservations fetch (`CustomerPortalReservationsView.vue:42-52`)
27. Loading state causes CLS (`CustomerPortalReservationsView.vue:171`)
28. Empty state lacks CTA (`CustomerPortalReservationsView.vue:172-174`)
29. Profile loading uses spinner, not skeleton (`CustomerPortalProfileView.vue:103-106`)
30. Validation errors lack `aria-describedby` association (`CustomerPortalProfileView.vue:114-155`)
31. Heading level skip (`CustomerPortalProfileView.vue:97, 110`)
32. Hover animation not gated by `prefers-reduced-motion` (`CustomerPortalHomeView.vue:162-165`)
33. Booking row overflows on mobile (`CustomerPortalReservationsView.vue:334-199`)
34. Name row grid has no mobile breakpoint (`CustomerRegisterView.vue:524-528`)
35. Reservations list is not semantic HTML (`CustomerPortalReservationsView.vue:176`)
36. Hardcoded error colors bypass brand tokens (`CustomerLoginView.vue:422-423`, `CustomerRegisterView.vue:596-597`)

## Recommendations
1. Fix P0 accessibility blockers first — keyboard navigation, focus traps, and dialog semantics
2. Address P0 state/error handling — silent failures and missing error states
3. Fix mobile sidebar toggle bug in `TenantLayout.vue`
4. Add `prefers-reduced-motion` media query to all GSAP transitions
5. Replace centered spinners with skeleton loaders matching card/table layouts
6. Associate all form labels with inputs via `for`/`htmlFor`
7. Replace `<a href="#" @click.prevent>` with `<button>` or `<RouterLink>`

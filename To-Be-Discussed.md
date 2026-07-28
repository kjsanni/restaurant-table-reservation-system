# To-Be-Discussed

## D-5: Offline PWA for Salons

### Design Questions

1. **Offline-first data model**
   - Which salon entities must be available offline? Appointments, clients, services, and staff shifts are the minimum viable set, but inventory and expenses may also be needed.
   - How should conflicts be resolved when a stylist creates an appointment offline that overlaps with one created by another stylist online?

2. **Sync strategy**
   - Pull-based sync on app foreground vs. push-based sync via WebSocket when connectivity returns?
   - What is the conflict resolution policy: last-write-wins, manual merge, or server-authoritative with client reconciliation?

3. **Storage limits and retention**
   - Service workers + IndexedDB can store ~50MB–100MB depending on browser. What is the maximum offline retention period before stale data is purged?
   - Should completed/cancelled appointments be kept indefinitely for audit, or pruned after 90 days?

4. **Authentication and security**
   - Offline mode requires a cached auth token. What is the token refresh strategy when the device reconnects?
   - Should sensitive client data (phone numbers, payment history) be encrypted in IndexedDB?

5. **Platform support**
   - Target browsers: Chrome, Safari, Firefox. Safari has stricter service worker and IndexedDB quotas.
   - Should the PWA be installable on iOS (requires specific manifest and meta tags)?

6. **UX during offline**
   - What indicators should be shown to the user when offline vs. syncing vs. sync-failed?
   - Should booking creation be blocked entirely when offline, or queued for later sync?

## D-6: Advanced Reporting & BI

- Already implemented (salon reports view exists).
- Future: export to PDF/Excel, scheduled email reports, custom report builder.

## D-7: Multi-location Support

- Already implemented (location model and views exist).
- Future: cross-location inventory transfers, centralized billing, location-level staff scheduling.

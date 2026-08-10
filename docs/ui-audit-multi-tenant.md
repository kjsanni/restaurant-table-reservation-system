# UI Audit — Multi-Tenant Portals

## Scope
Super-admin, tenant, and customer portals.

## Findings

### Accessibility
- All portals use semantic HTML and ARIA labels where needed.
- Focus styles are present on interactive elements (`.tenant-select:focus`, `.tenant-search:focus`).
- Color contrast appears adequate for primary text against white backgrounds.

### State Gaps
- `TenantSwitcher.vue` silently ignores API errors; consider adding an error state or retry button.
- Some views show loading skeletons, but a few data tables lack empty states.

### Focus & Keyboard
- Navigation is keyboard accessible via standard HTML elements.
- Modal dialogs should trap focus; verify existing `PopupBox.vue` and `EditReservation.vue` implementations.

### Layout Resilience
- Sidebar collapses correctly on mobile breakpoints.
- Tables use horizontal scroll wrappers where needed.

### Motion Hazards
- New GSAP transitions are `duration: 250ms` which respects `prefers-reduced-motion` if checked; recommend adding a media query guard.

## Priority

- P1: Add error state to `TenantSwitcher.vue`.
- P1: Add empty states to data tables lacking them.
- P2: Add `prefers-reduced-motion` guard to animation composable.
- P3: Verify modal focus trapping in popup components.

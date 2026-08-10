# Design Review — Multi-Tenant Portals

## Scope
Super-admin, tenant, and customer portals.

## Findings

### Super Admin
- Strong brand palette usage; consistent warm neutrals and amber accents.
- Sidebar + topbar layout is clean and scannable.
- Opportunity: card elevation could be more consistent across dashboard widgets.

### Tenant
- Footer copyright text is slightly cramped on mobile.
- Locale switcher placement is clear but could use more visual separation from user chip.
- Form inputs generally follow brand spacing, but a few dense settings pages need more vertical whitespace.

### Customer
- Landing hero animations (`fadeInUp`) are well-paced.
- Toast transitions (`AppToast.vue`) are smooth.
- Opportunity: some auth pages (login/register) have similar hero blocks that could be deduplicated into a shared component.

## Priority

- P1: Fix footer spacing on mobile tenant layout.
- P2: Extract shared auth hero into reusable component.
- P3: Harmonize card elevation tokens across admin dashboards.

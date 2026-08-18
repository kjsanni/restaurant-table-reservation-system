# Design Specification

## Overview
This document describes the current design system and architecture for the Restaurant Table Reservation System (RTRS) multi-tenant SaaS platform.

## Architecture
- **Backend:** Node.js + Express, Sequelize ORM, MySQL, Redis (BullMQ)
- **Frontend:** Vue 3 (Composition API) + TypeScript, Vite, Pinia, Vue Router
- **Multi-tenancy:** Module-based vertical architecture with tenant isolation
- **Brand:** Vuestic UI + custom brand tokens

## Verticals
1. **Restaurant** - Table reservations, floor plans, waitlists, loyalty
2. **Salon** - Appointments, service categories, staff management, cross-location
3. **Event** - Ticketing, QR check-in, wallet passes, web passes, photo uploads

## Theme System
- Centralized tokens in `front-end/src/theme/colors.js`
- Per-tenant theme overrides via `TenantCustomization` service
- Dark mode and reduced-motion support

## API Design
- Versioned routes under `/api/v1`
- OpenAPI 3.0 spec generated dynamically at `/api/v1/openapi.json`
- Contract tests for API surface validation
- Deprecation headers for version lifecycle management

## Testing
- Backend: Jest (155+ test suites, 1100+ tests)
- Frontend: Vitest (unit), Playwright (E2E, accessibility, visual regression)
- Contract tests for API specs
- Security review tooling (OWASP ASVS / STRIDE)
- Performance load testing

## Multi-Tenant Features
- Per-tenant migration runner with progress tracking
- Burst quotas and circuit breakers per tenant
- Custom domains and locale strings
- Data residency management (multi-region)
- Resource consumption metering
- Change management (deprecations, banners, templates)

## Deployment
- Podman-based container runtime
- GitHub Actions CI/CD
- Staging and production environments
- Sentry error tracking

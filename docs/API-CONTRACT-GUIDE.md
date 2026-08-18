# API Contract Guide

## Overview
All versioned API routes are served under `/api/v1`. The platform generates an OpenAPI 3.0 specification dynamically from the registered Express routes.

## OpenAPI Spec
- **Spec endpoint:** `GET /api/v1/openapi.json`
- **Swagger UI:** `GET /api/v1/docs`
- **API Version header:** `API-Version: 1.0.0` on all `/api/v1` responses

## Deprecation Headers
When routes are deprecated, the following headers are added:
- `Deprecation: <date>` - Date when the route was deprecated
- `Sunset: <date>` - Date when the route will be removed
- `Link: <url>; rel="deprecation"` - Link to migration guide
- `Deprecation-Description: <text>` - Human-readable deprecation notice

## Route Groups
Routes are organized by functional area:
- `/api/v1/auth` - Authentication and authorization
- `/api/v1/admin` - Super-admin operations
- `/api/v1/admin/tenants` - Tenant management
- `/api/v1/public` - Public endpoints
- `/api/v1/webhooks` - Webhook handlers
- `/api/v1/notifications` - Notification management
- `/api/v1/email-templates` - Email template management
- `/api/v1/legal` - Legal compliance
- `/api/v1/erpnext` - ERPNext integration
- `/api/v1/sync` - Data synchronization
- Vertical modules: `/api/v1/events`, `/api/v1/reservations`, etc.

## Versioning Policy
- Current version: `1.0.0`
- Breaking changes require a new API version (e.g., `/api/v2`)
- Non-breaking changes are additive within the current version
- Deprecated routes receive at least 90 days notice before removal

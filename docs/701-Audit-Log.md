---
title: Audit Logging
date: 2026-06-29
tags:
  - security
  - logging
  - audit
  - backend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[501-Security-Fixes]]"
---

# Audit Logging

> [!info] Security Visibility
> Comprehensive audit trail for authentication events and data mutations.

---

## Capture Scope

| Event Type | HTTP Status | Log Category | Middleware |
|---|---|---|---|
| Invalid credentials | 401 | `auth_failed` | `auditLog.js` |
| Missing/invalid token | 403 | `auth_failed` | `auditLog.js` |
| Successful authentication | 200 | `auth_success` | `auditLog.js` |
| Account lockout | 429 | `account_lockout` | `authService.js` |
| Reservation created | 201 | `reservation_created` | `auditLog.js` |
| Reservation updated | 200 | `reservation_updated` | `auditLog.js` |
| Reservation deleted | 200 | `reservation_deleted` | `auditLog.js` |
| Table created/updated/deleted | 200 | `table_*` | `auditLog.js` |
| RBAC changes | 200 | `rbac_*` | `auditLog.js` |

---

## Implementation

- `back-end/src/middleware/auditLog.js` — generic action logger
- Applied to `/api/v1/reservations`, `/api/v1/tables`, `/api/v1/rbac`, `/api/v1/waitlist`, `/api/v1/payments`, `/api/v1/schedule`, `/api/v1/customers`
- Uses `logAction` middleware in `server.js` route registration

---

## Audit Trail Features

| Feature | Implementation |
|---|---|
| User context | `req.user.id` from JWT |
| IP address | `req.ip` or `req.connection.remoteAddress` |
| Request context | Method, URL, params |
| Timestamp | `createdAt` auto-set by Sequelize |
| Failure reason | Error message from handler |
| No sensitive data | Passwords, tokens, and raw secrets excluded |

---

## Database Model

**File**: `back-end/src/db/models/auditLog.js`  
**Migration**: `20260102000004-create-auditlog.js`

---

## Frontend Viewer

**View**: `front-end/src/views/AuditLogView.vue`  
**Route**: `/audit-logs` (requires `view_audit_logs`)

### Features
- Table wrapped in a white card with soft shadow
- `entityType` shown as a blue pill badge
- Hover highlight on rows
- Empty state message
- Spinner loading state

---

## API Endpoint

**File**: `back-end/src/routes/auditLog.router.js`  
**Controller**: `back-end/src/controllers/auditLog.controller.js`  
**DAO**: `back-end/src/DAOs/auditLog.dao.js`

Permitted query params: `page`, `per_page`, `action`, `resource_type`, `search`, `from`, `to`.

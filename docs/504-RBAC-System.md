---
title: RBAC System
date: 2026-06-29
tags:
  - features
  - rbac
  - roles
  - permissions
  - backend
  - frontend
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[501-Security-Fixes]]"
  - "[[503-UI-UX-Improvements]]"
  - "[[601-Key-Decisions]]"
---

# RBAC System — Roles, Groups, Permissions

> [!abstract] Granular Access Control
> Full role-based access control with dynamic permissions, user groups, and middleware enforcement.

---

## Database Models

| Model | Table | Purpose |
|---|---|---|
| `Role` | `roles` | Name, description, permissions JSON, isSystem flag |
| `Group` | `groups` | Name, description, permissions JSON |
| `User` | `users` | `role` string + `permissions` JSON (merged from role, groups, user) |

### Junction Tables
- `user_groups` — User ↔ Group many-to-many
- `table_staff` — Table ↔ User (for staff assignment)
- `reservation_staff` — Reservation ↔ User (for waiting staff)

---

## Default Seeded Data

### Roles (`20260627000000-default-roles.js`)
| Role | Built-in | Default Permissions |
|---|---|---|
| `admin` | Yes | All permissions |
| `manager` | Yes | view_reservations, edit_reservations, manage_tables, manage_schedule, view_audit_logs |
| `staff` | Yes | view_reservations, edit_reservations, manage_tables |

### Groups (`20260627000001-default-groups.js`)
| Group | Purpose |
|---|---|
| `Front of House` | Front-of-house staff permissions |
| `Kitchen` | Kitchen staff permissions |
| `Management` | Management permissions |
| `waiting_staff` | Waiting staff (can be assigned to reservations) |

---

## API Endpoints

### Roles — `back-end/src/routes/rbac.router.js`
| Method | Path | Permission | Handler |
|---|---|---|---|
| GET | `/api/v1/rbac/roles` | manage_roles | `getRolesHandler` |
| POST | `/api/v1/rbac/roles` | manage_roles | `createRoleHandler` |
| GET | `/api/v1/rbac/roles/:id` | manage_roles | `getRoleHandler` |
| PATCH | `/api/v1/rbac/roles/:id` | manage_roles | `updateRoleHandler` |
| DELETE | `/api/v1/rbac/roles/:id` | manage_roles | `deleteRoleHandler` |

### Groups — `back-end/src/routes/rbac.router.js`
| Method | Path | Permission | Handler |
|---|---|---|---|
| GET | `/api/v1/rbac/groups` | manage_groups | `getGroupsHandler` |
| POST | `/api/v1/rbac/groups` | manage_groups | `createGroupHandler` |
| GET | `/api/v1/rbac/groups/:id` | manage_groups | `getGroupHandler` |
| PATCH | `/api/v1/rbac/groups/:id` | manage_groups | `updateGroupHandler` |
| DELETE | `/api/v1/rbac/groups/:id` | manage_groups | `deleteGroupHandler` |
| GET | `/api/v1/rbac/groups/name/:name` | manage_groups | `getGroupByNameHandler` |
| POST | `/api/v1/rbac/groups/:id/users` | manage_groups | `addUserToGroupHandler` |
| DELETE | `/api/v1/rbac/groups/:id/users/:userId` | manage_groups | `removeUserFromGroupHandler` |

---

## Permission Resolution

Backend merges permissions from three sources in `rbacService.js`:
1. **Role** permissions (`roles.permissions` JSON)
2. **Group** permissions (`groups.permissions` JSON)
3. **User** direct overrides (future)

Frontend reads `user.permissions` and uses computed properties like `canEditReservations` instead of role checks.

### Available Permission Keys
```js
{
  view_reservations: true,
  edit_reservations: true,
  manage_tables: true,
  manage_schedule: true,
  manage_staff: true,
  manage_roles: true,
  manage_groups: true,
  view_audit_logs: true,
  view_reports: true,
  manage_waitlist: true,
  edit_customer_profiles: true,
  view_revenue_reports: true
}
```

---

## Middleware Integration

### `protectedRoute(permission, handler)`
- Wraps GET endpoints; checks if user has the permission
- Returns 403 if denied

### `writeRoute(permission, handler)`
- Wraps POST/PATCH/DELETE endpoints
- Also validates CSRF token
- Returns 403 if denied

### `requirePermission(permission)`
- Direct middleware function for use in route handlers
- Used in staff assignment endpoints (`manage_tables`)

---

## Frontend Permission Gating

```javascript
// Example from TheReservations.vue
const canEditReservations = computed(() => authStore.user?.permissions?.edit_reservations)
const canManageTables = computed(() => authStore.user?.permissions?.manage_tables)
const canManageRoles = computed(() => authStore.user?.permissions?.manage_roles)
const canManageGroups = computed(() => authStore.user?.permissions?.manage_groups)
```

Frontend routes declare `meta.requiresPermission` and the router guard checks `user.permissions[permission]`.

---

## Frontend Views

| View | Route | Required Permission |
|---|---|---|
| `RoleManagementView.vue` | `/roles/manage` | `manage_roles` |
| `GroupManagementView.vue` | `/groups/manage` | `manage_groups` |
| `StaffManagementView.vue` | `/staff/manage` | `manage_staff` |
| `TableManagementView.vue` | `/tables/manage` | `manage_tables` |
| `WaitlistView.vue` | `/waitlist` | `manage_tables` |
| `AuditLogView.vue` | `/audit-logs` | `view_audit_logs` |

---

## Key Files

| Layer | File |
|---|---|
| Models | `back-end/src/db/models/role.js`, `group.js`, `user.js` |
| DAOs | `back-end/src/DAOs/role.dao.js`, `group.dao.js` |
| Services | `back-end/src/services/rbacService.js` |
| Controllers | `back-end/src/controllers/rbac.controller.js` |
| Routes | `back-end/src/routes/rbac.router.js` |
| Middleware | `back-end/src/middleware/auth.js` (`requirePermission`) |
| Frontend Views | `RoleManagementView.vue`, `GroupManagementView.vue`, `StaffManagementView.vue` |
| Frontend Services | `roleAPI.js`, `groupAPI.js` |

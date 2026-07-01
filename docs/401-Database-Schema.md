---
title: Database Schema
date: 2026-06-29
tags:
  - database
  - schema
  - models
  - sequelize
  - mysql
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[601-Key-Decisions]]"
---

# Database Schema

> [!note] Migration Count
> **22 migrations**, **15 Sequelize models**, MySQL 8+

---

## Core Models

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Admin and customer accounts with roles |
| `Customer` | `customers` | Guest profiles with loyalty tags |
| `Reservation` | `reservations` | Table bookings (hybrid soft/hard delete) |
| `Table` | `tables` | Restaurant tables (max capacity 8, status enum, `price` field) |
| `Payment` | `payments` | Transaction records with method classification, `discount` field |
| `Waitlist` | `waitlist` | Pending guest queue |
| `Role` | `roles` | RBAC role definitions with JSON permissions |
| `Group` | `groups` | RBAC user groups with JSON permissions |
| `RefreshToken` | `refresh_tokens` | JWT refresh token persistence |
| `LoginAttempt` | `login_attempts` | Account lockout tracking |
| `AuditLog` | `audit_logs` | Security event audit trail |
| `Schedule` | `schedule` | Weekly operating hours |
| `Holiday` | `holidays` | Closed/exception dates |
| `Setting` | `settings` | Application configuration (JSON values) |
| `RadiusUser` | `radius_users` | FreeRADIUS integration |

---

## Table Model Updates

| Field | Type | Purpose |
|---|---|---|
| `price` | DECIMAL(10,2) | Table pricing for revenue tracking |
| `parentTableId` | INTEGER | Self-reference for merged/combined tables |

---

## Junction / Pivot Tables

| Table | Models | Purpose |
|---|---|---|
| `user_groups` | User ↔ Group | Many-to-many group membership |
| `table_staff` | Table ↔ User | Staff assignments to tables |
| `reservation_staff` | Reservation ↔ User | Waiting staff assigned to reservations |
| `role_permissions` | (planned) Role ↔ Permission | Granular permission mapping |

---

## Key Migration Patterns

### ENUM Changes (Raw SQL)
```sql
ALTER TABLE `tables` MODIFY COLUMN `status` VARCHAR(50) NULL;
ALTER TABLE `reservations` MODIFY COLUMN `resStatus` VARCHAR(50) NULL;
```
- Replaced risky `changeColumn` ENUM migrations with raw SQL
- Avoids Sequelize ENUM literal limitations

### JSON Columns
- `roles.permissions` - JSON blobs of permission keys
- `groups.permissions` - JSON blobs of permission keys
- `settings.value` - JSON for flexible configuration

### Case Sensitivity
- Fixed: `"Tables"` → `"tables"` (lowercase)
- MySQL tables are case-sensitive on Linux/macOS

### Soft-Delete + Terminal Hard-Delete
- `Reservation` uses status-based lifecycle
- Active states (`pending`, `missed`) soft-delete via `resStatus = 'cancelled'`
- Terminal states (`cancelled`, `seated`, `completed`, `missed`) hard-delete on subsequent deletion

---

## Model Associations

### User
- `belongsToMany(Table, { through: 'table_staff' })`
- `belongsToMany(Reservation, { through: 'reservation_staff' })`
- `belongsToMany(Group, { through: 'user_groups' })`
- Default permissions injected in `auth.js` middleware when not stored in DB

### Table
- `belongsToMany(User, { through: 'table_staff' })`
- `belongsTo(Table, { as: 'parentTable', foreignKey: 'parentTableId' })` — Self-reference for merged tables
- `hasMany(Table, { as: 'mergedTables', foreignKey: 'parentTableId' })` — Child tables in a merge group

### Reservation
- `belongsToMany(User, { through: 'reservation_staff' })`
- `hasMany(Payment)`

### Customer
- `hasMany(Reservation)`

---

## Optimization Highlights

| Area | Improvement |
|---|---|
| N+1 queries | Removed in bulk operations (`bulkCancel`, `bulkUpdate`) |
| Stats queries | Combined into single optimized queries |
| Map lookups | Replaced `.find()` loops with O(1) access in `TheReservations.vue` |
| Heatmap queries | Scoped to `pending` reservations; v2 supports date range grouping |

---

## Connection Handling

- Sequelize connection pooling configured
- Transaction support for bulk operations and payment classification
- Hybrid deletion balances audit requirements with data hygiene

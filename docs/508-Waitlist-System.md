---
title: Waitlist System
date: 2026-06-29
tags:
  - features
  - waitlist
  - auto-seat
  - backend
  - frontend
  - socket.io
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[302-Frontend-Architecture]]"
  - "[[401-Database-Schema]]"
  - "[[504-RBAC-System]]"
---

# Waitlist System — Management & Auto-Seat Workflow

> [!abstract] Customer Waitlist with Smart Seating Suggestions
> Queue guests when tables are full, assign waiting staff, and auto-suggest seating when tables free up.

---

## Database Model

| Model | Table | Key Fields |
|---|---|---|
| `Waitlist` | `waitlist` | `id`, `customerName`, `partySize`, `phone`, `status` (`waiting`, `seated`, `left`), `createdAt` |

---

## API Endpoints

**Base Path**: `/api/v1/waitlist` (protected by `manage_tables`)

| Method | Path | Handler | Description |
|---|---|---|---|
| GET | `/api/v1/waitlist` | `getWaitlistHandler` | List all waitlist entries |
| POST | `/api/v1/waitlist` | `createWaitlistHandler` | Add guest to waitlist |
| PATCH | `/api/v1/waitlist/:id` | `updateWaitlistHandler` | Update entry (status, notes) |
| DELETE | `/api/v1/waitlist/:id` | `deleteWaitlistHandler` | Remove entry |
| GET | `/api/v1/waitlist/stats` | `getWaitlistStatsHandler` | Summary counts |
| GET | `/api/v1/waitlist/suggest/:tableId` | `getSuggestionHandler` | Best-fit guest for freed table |
| POST | `/api/v1/waitlist/:entryId/seat?tableId=...` | `seatEntryHandler` | Auto-create reservation and seat |

---

## Auto-Seat Workflow

### Trigger
Backend emits Socket.io event `table-freed` with `{ tableId }` when a table is freed.

### Frontend Flow
1. Client receives `table-freed` event
2. Calls `waitlistAPI.getSuggestion(tableId)`
3. Backend priority logic:
   - Filter: `status = 'waiting'`
   - Filter: `entry.partySize <= table.capacity`
   - Sort: oldest `createdAt` first (FIFO)
   - Break ties: smaller party size first
4. Frontend shows suggestion banner:
   ```
   Table 5 is free. Suggest seating: John Doe (party of 2, waiting 25 min).
   [ Accept (Seat) ] [ Override ] [ Dismiss ]
   ```
5. Accept calls `waitlistAPI.seatEntry(entryId, tableId)`

### Edge Cases
- No compatible entries → toast: "Table free. No waitlist matches."
- Stale suggestions (already seated) → handled gracefully with 409 response
- Rapid multiple `table-freed` events → debounced/queued on frontend

---

## Frontend Views & Components

| File | Purpose |
|---|---|
| `front-end/src/views/WaitlistView.vue` | Main waitlist page (stats cards + entry cards) |
| `front-end/src/services/waitlistAPI.js` | API client for waitlist CRUD |
| `Socket.io client` | `table-freed` event listener |

---

## Staff Assignment on Waitlist

- `AssignStaff.vue` lets admins assign `waiting_staff` group members to waitlist entries
- Staff assignment modal available when user has `manage_tables` permission
- Staff limit: 5 tables per staff member enforced by `tableService.js`

---

## Permission

| Path | Required Permission |
|---|---|
| All `/api/v1/waitlist/*` | `manage_tables` |

---

## Key Files

| Layer | File |
|---|---|
| Model | `back-end/src/db/models/waitlist.js` |
| Migration | `back-end/src/db/migrations/20260627000006-create-waitlist.js` |
| DAO | `back-end/src/DAOs/waitlist.dao.js` |
| Service | `back-end/src/services/waitlistService.js` |
| Controller | `back-end/src/controllers/waitlist.controller.js` |
| Routes | `back-end/src/routes/waitlist.router.js` |
| Frontend API | `front-end/src/services/waitlistAPI.js` |
| Frontend View | `front-end/src/views/WaitlistView.vue` |
| Socket | `back-end/src/utils/server.js` (io.emit `table-freed`) |

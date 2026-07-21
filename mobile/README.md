# RTRS Staff App

React Native (Expo) staff app for the Restaurant Table Reservation System.

## Features

- **Floor Management** — real-time table status with Socket.IO updates
  - Tap a table to block/unblock
  - Long-press to free a table
  - Live updates via `table-status-changed` and `table-freed` socket events
- **Reservations** — today's reservations with status actions (seat, complete, cancel)
- **Waitlist** — manage waitlisted guests with real-time offer notifications via `waitlist-offer`
- **Authentication** — JWT login with token persistence and auto-restore

## Setup

```bash
cd mobile
npm install
npx expo start
```

## Configuration

Set these environment variables (create `.env` or pass via `app.json` `extra`):

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO server URL | `http://localhost:8000` |

## Architecture

```
mobile/
├── App.tsx                      # Entry point
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Auth-gated tab navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── FloorManagementScreen.tsx   # Real-time Socket.IO table grid
│   │   ├── ReservationsScreen.tsx
│   │   └── WaitlistScreen.tsx
│   ├── services/
│   │   ├── api.ts               # Axios client with JWT + tenant headers
│   │   ├── socket.ts            # Socket.IO client + event listeners
│   │   ├── auth.ts              # Login/logout/getMe
│   │   ├── tables.ts            # Table CRUD + block/free
│   │   ├── reservations.ts      # Reservation list + status updates
│   │   └── waitlist.ts          # Waitlist list + status updates
│   ├── store/
│   │   └── auth.ts              # Zustand auth store (token, user, login)
│   └── theme/
│       └── colors.ts            # Brand palette (mirrors web app)
```

## Real-Time Events

The app subscribes to these Socket.IO events emitted by the backend:

| Event | Payload | Screen |
|-------|---------|--------|
| `table-status-changed` | `{ tableId, status }` | Floor Management |
| `table-freed` | `{ tableId, reservationId }` | Floor Management |
| `waitlist-offer` | `{ tableId?, reservationId?, message }` | Waitlist |

## Brand Theme

Colors are mirrored from `front-end/src/theme/colors.js` to maintain visual consistency with the web app. The warm brown/amber palette is applied across all screens.

## Development

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript type checking
```

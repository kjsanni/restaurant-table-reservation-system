# Tenant Platform Developer Onboarding

## Prerequisites

- Node.js 18+
- MySQL 8+
- Redis (for caching, BullMQ, and distributed locks)
- npm

## Local Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd restaurant-table-reservation-system
   npm install
   cd back-end && npm install
   cd ../front-end && npm install
   ```

2. Configure environment variables in `back-end/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=restaurant_reservation
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your-jwt-secret
   ```

3. Run database migrations:
   ```bash
   cd back-end
   npm run migrate:up
   ```

4. Start backend and frontend:
   ```bash
   # Terminal 1 — backend
   cd back-end && npm run dev

   # Terminal 2 — frontend
   cd front-end && npm run dev
   ```

## Running Tests

```bash
cd back-end && npm test
cd front-end && npm run test:unit
```

## Platform Routes

All tenant-platform routes live under `back-end/src/tenant-platform/`. Key folders:

- `controllers/` — request handlers
- `routes/` — Express routers
- `DAOs/` — database access objects
- `services/` — business logic
- `middleware/` — auth, tenant resolution, CSRF

## Auth & RBAC

- Super-admin routes use `requireSuperAdmin`.
- Platform routes use `requirePlatformRole("platform_*")`.
- Tenant routes use `protect` + tenant context middleware.

## Common Tasks

| Task | Command |
|------|---------|
| Run backend tests | `cd back-end && npm test` |
| Run frontend build | `cd front-end && npm run build` |
| Run frontend lint | `cd front-end && npm run lint` |
| Run frontend typecheck | `cd front-end && npx vue-tsc --noEmit --declaration false` |
| Apply migrations | `cd back-end && npm run migrate:up` |

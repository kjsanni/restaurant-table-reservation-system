<h1 align="center">
<img src="https://github.com/slavyanHristov/restaurant-table-reservation-system/blob/feature/readme/screenshots/rtrs.png" width="300" />
<br>
Restaurant Table Reservation System - RTRS
<br>
</h1>

<h4 align="center">Table reservation web app for any restaurant with RBAC, payments, analytics, real-time waitlist management, and multi-tenant SaaS support</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#multi-tenant-deployment">Multi-Tenant Deployment</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credentials">Default Credentials</a> •
  <a href="#security">Security</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contact">Contact</a>
</p>

---

## Key Features

### Core Functionality
- **Responsive UI** — Vue 3 + PrimeVue with unified design system (Inter font, rounded cards, status chips, spinner loading)
- **Single Page Application** — Faster loading experience with Vite build tooling
- **Reservation Management** — Create, edit, cancel, and seat guests with drag-and-drop floor plan
- **Table Management** — Register tables with capacity, block/unblock, assign staff (5-table limit per staff)
- **Waitlist Management** — Queue guests, auto-suggest seating when tables free up (Socket.io real-time)
- **Staff Assignment** — Assign waiting staff to reservations and tables

### Multi-Tenant SaaS Platform
- **Multi-Tenant Architecture** — Feature-flagged `TENANT_MODE=enabled`; single repo, zero overhead when disabled
- **Tenant Resolution** — Header (`X-Tenant-Id`, `X-Tenant-Slug`) or subdomain-based routing
- **Subscription Gating** — Paystack integration with plans (starter/growth/enterprise), grace periods, auto-suspension
- **Tenant Isolation** — Composite unique indexes, Redis tenant caching (5min TTL), distributed cron lock
- **Platform Admin Dashboard** — Create/manage tenants, view MRR, enable/disable tenants
- **Per-Tenant Settings** — Branding, currency, business hours, notification channels, Paystack keys
- **Usage Limits** — Enforced per-plan limits for tables and reservations

### Background Jobs & Performance
- **BullMQ Job Queue** — Offloaded notifications, email, WhatsApp, CSV/PDF exports from request thread
- **Redis Cache** — Tenant resolution caching, schedule/holiday caching, rate-limit shared store
- **Rate Limiting** — Auth (10/15min), general (100/15min), bulk ops (5/hr), admin actions (3/hr)
- **DB Connection Pool** — Configurable pool settings for PM2 cluster deployments
- **Distributed Cron** — Redis lock ensures single-instance cron execution across cluster

### Payment & Analytics
- **Payment Tracking** — Record payments with auto-classification (deposit/partial/paid/unpaid)
- **Revenue Reports** — Time-series dashboard with SVG charts, CSV export, preset ranges
- **Payment Dashboard** — Admin view with status summary, bar chart, filterable table

### RBAC & Security
- **Role-Based Access Control** — Admin, Manager, Staff roles with granular permissions
- **Group Management** — Create user groups with permission sets
- **Permission-Based UI** — Action buttons match backend `requirePermission` checks
- **JWT Authentication** — Secure tokens with rotation support
- **CSRF Protection** — Strict sameSite enforcement
- **CSP Headers** — Environment-aware content security policy
- **Account Lockout** — 5 failed attempts / 15-minute lockout
- **Audit Logging** — Comprehensive trail for authentication and data mutations
- **Rate Limiting** — API protection against brute-force attacks

### Scheduling & Calendar
- **Schedule Management** — Weekly opening hours with toggle switches
- **Holiday Management** — Add/remove closed dates
- **Calendar View** — Visual calendar for opening hours and reservations

### Analytics & Reporting
- **Weekly Heatmap** — Reservation density by day × hour (pending only)
- **2D Heatmap** — Date-range matrix with calendar drill-down mode
- **No-Show Widget** — No-show rate tracking with color-coded rates and trend indicators
- **General Reports** — Filterable report dashboard

### Search & History
- **Global Search** — Search reservations by name, phone, email, date, time
- **Customer Loyalty Tags** — Tag customers for segmentation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js + Express |
| Backend ORM | Sequelize + MySQL |
| Authentication | JWT (Tymon JWTAuth pattern) |
| Real-time | Socket.io |
| Frontend Framework | Vue 3 (Composition API) |
| Frontend UI | PrimeVue + Tailwind CSS + CSS custom properties |
| State Management | Pinia |
| Build Tool | Vite |
| Background Jobs | BullMQ + Redis |
| Cache | Redis |
| Testing | Playwright (E2E), Jest (unit) |

---

## Multi-Tenant Deployment

### Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
- Redis 5+ (for caching, rate limiting, BullMQ)
- Git

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
TENANT_MODE=enabled
REDIS_HOST=localhost
REDIS_PORT=6379
DB_POOL_MIN=10
DB_POOL_MAX=50
JWT_SECRET=<32+ random chars>
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```

### Initialize Database
```bash
cd back-end
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### Run with PM2 (Cluster Mode)
```bash
cd back-end
pm2 start src/app.js --name rtrs --instances max --exec_mode cluster
pm2 save
pm2 startup
```

### Frontend Build
```bash
cd front-end
VITE_TENANT_MODE=enabled npm run build
```

---

## How To Use

### Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
- Redis 5+ (optional, for multi-tenant features)
- Git

```bash
# Clone this repository
$ git clone https://github.com/kjsanni/restaurant-table-reservation-system.git

# Go into the repository
$ cd restaurant-table-reservation-system

# Install dependencies
$ npm install
$ cd back-end && npm install && cd ..
$ cd front-end && npm install && cd ..

# Set up backend environment
$ cp back-end/.env.production.example back-end/.env
# Edit back-end/.env with your DB credentials and JWT secret

# Initialize database
$ cd back-end
$ npx sequelize-cli db:migrate
$ npx sequelize-cli db:seed:all

# Run backend (PM2, port 8000)
$ cd back-end && npm run dev

# Run frontend (Vite, port 8080)
$ cd front-end && npm run dev
```

### Production Deployment
See `DEPLOYMENT-GUIDE.md` for Apache/Nginx + PM2 setup.

---

## Sessions & Documentation

### Current Sprint: Multi-Tenant Production Readiness (2026-07-18)
- **Phase 1 Complete** — Middleware mount order, tenantId in 22 models, Redis caching, rate limiters, distributed cron lock, tenant switcher pagination, DB connection pool
- **Phase 2 Complete** — DAO/service/controller tenantId wiring, BullMQ job queue scaffold, frontend tenant-aware fetching, end-to-end multi-tenant tests, production deployment checklist

### Documentation Index
- `docs/README.md` — Documentation index
- `CHANGELOG.md` — Version history
- `DEPLOYMENT-GUIDE.md` — Production setup
- `SECURITY_AUDIT_REPORT.md` — Security findings
- `Specs/` — Implementation specs and checklists
- `Sessions/` — Session notes and architecture decisions
- `docs/` — Full Obsidian documentation vault

### Key Docs
- [[903-Tenant-Platform-Module]] — Multi-tenant architecture, migrations, middleware
- [[904-Multi-Tenant-Query-Scoping-Tracker]] — DAO scoping status and implementation details
- [[900-Session-Summary]] — Development session history
- `Specs/production-deployment-checklist.md` — Production readiness checklist

---

## Default Credentials

**⚠️ Change these immediately in production!**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rtrs.com` | `admin123` |

---

## Security

- **JWT Secret** — Generate with `openssl rand -hex 32` and set in `.env`
- **CORS Origins** — Set explicit origins in `CORS_ORIGINS` env var
- **Database** — Use strong passwords; never commit `.env` files
- **Audit** — Review `SECURITY_AUDIT_REPORT.md` for known vulnerabilities and remediation steps

---

## Documentation

- `docs/README.md` — Documentation index
- `CHANGELOG.md` — Version history
- `DEPLOYMENT-GUIDE.md` — Production setup
- `SECURITY_AUDIT_REPORT.md` — Security findings
- `Specs/` — Implementation specs and production checklists
- `Sessions/` — Session notes and architecture decisions
- `docs/` — Full Obsidian documentation vault

---

## Credits

- [Node.js](https://nodejs.org/)
- [Vue.js](https://vuejs.org/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [PrimeVue](https://primevue.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.io](https://socket.io/)
- [Playwright](https://playwright.dev/)
- [BullMQ](https://docs.bullmq.io/)

---

## Contact

> GitHub [@kjsanni](https://github.com/kjsanni)

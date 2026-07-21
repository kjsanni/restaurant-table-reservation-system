# Restaurant Table Reservation System (RTRS)

Multi-tenant restaurant table reservation SaaS with **WhatsApp-first ordering**, **ShaQ Express delivery integration**, **Paystack payments (GHS)**, and **Ghana-localized legal compliance**. Built with Node.js, Express, Sequelize, Vue 3, and BullMQ.

---

## Key Features

### Core Operations
- **Reservation Management** — Create, edit, cancel, and seat guests with drag-and-drop floor plan and calendar views
- **Table Management** — Register tables with capacity, block/unblock, merge for large parties, assign staff
- **Waitlist Management** — Queue guests, auto-suggest seating when tables free up via Socket.io real-time updates
- **Schedule & Holidays** — Weekly opening hours, holiday closures, schedule enforcement on reservations
- **Heatmap Analytics** — 1D weekly + 2D date-hour reservation density matrices
- **No-Show Tracking** — One-click marking, stats widget, trend indicators
- **Customer Database** — Profiles, loyalty tags, visit history, preferences

### WhatsApp-Native Customer Experience
- **WhatsApp Ordering** — End-to-end conversational ordering via WhatsApp Business API (menu browsing, cart, checkout, payment link)
- **WhatsApp Reservations** — Customers can book tables via WhatsApp conversation
- **WhatsApp Delivery Requests** — Location sharing via WhatsApp native location message; address fallback with geocoding
- **WhatsApp Notifications** — Reservation confirmations, reminders, delivery tracking, status updates via utility templates
- **WhatsApp Webhook Receiver** — Inbound text + location message handling, tenant resolution by `phone_number_id`

### Delivery Integration
- **ShaQ Express API** — Package creation, tracking, cancellation, webhook status sync (`public-api.shaqexpress.com`)
- **Location Collection** — WhatsApp native location sharing, text address parsing, reverse geocoding (Nominatim)
- **Delivery Dashboard** — Admin UI to create, track, and manage deliveries
- **Order Tracking** — Customer-facing tracking view with status history
- **Delivery Fee Calculation** — Configurable per-tenant delivery fees

### Multi-Tenant SaaS Platform
- **Feature-Flagged Multi-Tenancy** — `TENANT_MODE=enabled`; single repo, zero overhead when disabled
- **Tenant Resolution** — Header (`X-Tenant-Id`, `X-Tenant-Slug`) or subdomain-based routing
- **Subscription Billing** — Paystack integration with starter/growth/enterprise plans, grace periods, auto-suspension
- **Bring-Your-Own Gateway (BYOK)** — Tenants can bring own Paystack keys + ShaQ Express credentials for discounted pricing
- **Per-Tenant Settings** — Branding, currency (GHS default), business hours, notification channels, message templates
- **Usage Limits** — Enforced per-plan limits for tables and reservations
- **Platform Admin Dashboard** — Create/manage tenants, view MRR, usage, revenue, bulk operations, support notes, trial management, invoices, billing emails, timeline, grace period, white-label, API keys, audit log, notifications, onboarding checklist

### Background Jobs & Performance
- **BullMQ Job Queue** — Offloaded notifications, email, WhatsApp, CSV/PDF exports with retry/DLQ
- **Redis Cache** — Tenant resolution caching (5min TTL), schedule/holiday caching, rate-limit shared store
- **Rate Limiting** — Auth (10/15min), general (100/15min), bulk ops (5/hr), admin actions (3/hr)
- **DB Connection Pool** — Configurable pool settings for PM2 cluster deployments
- **Distributed Cron** — Redis lock ensures single-instance cron execution across cluster
- **Read Replica** — Sequelize read/write splitting with connection fallback

### Payments & Analytics
- **Payment Tracking** — Record payments with auto-classification (deposit/partial/paid/unpaid)
- **Paystack Integration** — GHS payments via Mobile Money (MTN, Vodafone, AirtelTigo), cards, banks
- **Revenue Reports** — Time-series dashboard with SVG charts, CSV export, preset ranges
- **Payment Dashboard** — Admin view with status summary, bar chart, filterable table

### RBAC & Security
- **Role-Based Access Control** — Admin, Manager, Staff roles with granular permissions
- **Group Management** — Create user groups with permission sets
- **Permission-Based UI** — Action buttons match backend `requirePermission` checks
- **JWT Authentication** — Secure tokens with rotation support
- **CSRF Protection** — Strict sameSite enforcement
- **CSP Headers** — Environment-aware content security policy
- **Account Lockout** — 5 failed attempts / 15-minute sliding window
- **Audit Logging** — Comprehensive trail for authentication and data mutations
- **Webhook Security** — HMAC-SHA512 signature verification for Paystack + ShaQ Express

### Scheduling & Calendar
- **Schedule Management** — Weekly opening hours with toggle switches
- **Holiday Management** — Add/remove closed dates
- **Calendar View** — Visual calendar for opening hours and reservations, drag-to-create

### Legal & Compliance (Ghana)
- **9 Legal Documents** — Privacy, Terms, Cookies, GDPR, DPA, Customer, Tenant/Merchant, Payment & Refund, Accessibility
- **Tamper-Evident Acceptances** — Immutable `legal_acceptances` records with version tracking
- **Onboarding Enforcement** — Required Merchant Policy + DPA acceptance before going live
- **DPA 2012 Compliance** — Data Protection Act 2012 (Act 843) aligned; DPC framework

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js + Express |
| Backend ORM | Sequelize + MySQL |
| Authentication | JWT with rotation |
| Authorization | RBAC (roles, groups, granular permissions) |
| Real-time | Socket.io |
| Frontend Framework | Vue 3 (Composition API) + TypeScript |
| Frontend UI | Vuestic UI + CSS custom properties |
| State Management | Pinia |
| Build Tool | Vite |
| Background Jobs | BullMQ + Redis |
| Cache | Redis |
| Payments | Paystack (GHS — Mobile Money, cards, banks) |
| Delivery | ShaQ Express API (`public-api.shaqexpress.com`) |
| Messaging | WhatsApp Business API (Meta) |
| Testing | Jest (backend), Vitest + Playwright (frontend) |

---

## Project Structure

```
restaurant-table-reservation-system/
├── back-end/
│   ├── src/
│   │   ├── routes/              # 11+ domain routers + tenant-platform routes
│   │   ├── controllers/         # 10+ controllers + tenant admin + billing
│   │   ├── services/            # 9+ services + tenant-platform + delivery + WhatsApp
│   │   ├── DAOs/                # 10+ DAOs + tenant-platform + onboarding
│   │   ├── middleware/          # 12+ middleware (auth, RBAC, CSRF, rate-limit, audit)
│   │   ├── db/
│   │   │   ├── models/          # 22+ Sequelize models
│   │   │   ├── migrations/      # 24+ migrations
│   │   │   └── seeders/         # 6+ seeders
│   │   ├── queues/              # BullMQ workers (notification, report)
│   │   └── utils/               # Server bootstrap, JWT rotation, route helpers
│   └── ecosystem.config.js      # PM2 production config
├── front-end/
│   ├── src/
│   │   ├── views/               # 23+ page views
│   │   ├── components/          # 33+ reusable components
│   │   ├── router/              # 21+ Vue Router routes
│   │   ├── stores/              # Pinia stores
│   │   ├── services/            # 12+ API service files
│   │   └── assets/              # base.css, design-system.css
│   └── index.html
├── legal/                       # 9 Ghana-localised legal documents
├── Specs/                       # Implementation specs and checklists
├── DEPLOYMENT-GUIDE.md          # Production setup (Apache/Nginx + PM2)
└── CHANGELOG.md                 # Version history
```

---

## Current Status

### Test Coverage
- **Backend:** 181+ Jest tests pass (200+ total test count historically; currently 181 passing with uncommitted delivery/WhatsApp tests)
- **Frontend:** 20+ unit tests pass (Vitest + Playwright E2E)
- **Multi-tenant E2E:** 110/110 tests pass

### Uncommitted Work (2026-07-21)
- **Backend:** Shaq Express delivery integration (Deliveries table, DAO, service, controller, webhook receiver)
- **Backend:** WhatsApp ordering integration (controller, routes, service, menu/promotion exposure)
- **Backend:** Two stale migrations fixed with idempotency guards
- **Frontend:** `DeliveryDashboardView`, `OrderTrackView`, `WhatsAppOrderingSettingsView`, `deliveryAPI.js`
- **Frontend:** `MenuView`, `PromotionsManagementView`, `CustomerLandingView` updated for WhatsApp sharing

### Uncommitted Work (2026-07-20)
- Frontend: `PageHeader` removed from standalone views, replaced with inline `topbar`
- Backend: BullMQ/Jest teardown leak fixed, `--forceExit` removed
- Backend: Missing tenant columns added (`trialExtendsTo`, `convertedFromTrialAt`, `gracePeriodDays`)
- Backend: Notification router RBAC fixed
- Backend: Revenue DAO uses dynamic plan prices

### Known Issues
- Security audit identified 3 CRITICAL and 7 HIGH vulnerabilities (see `SECURITY_AUDIT_REPORT.md`)
- `util yaml-js.js` missing module — backend dependency issue
- Vue `Suspense` experimental feature warning

---

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
- Redis 5+ (for caching, rate limiting, BullMQ)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/kjsanni/restaurant-table-reservation-system.git
cd restaurant-table-reservation-system

# Install dependencies
npm install
cd back-end && npm install && cd ..
cd front-end && npm install && cd ..

# Set up backend environment
cp back-end/.env.production.example back-end/.env
# Edit back-end/.env with your DB credentials and JWT secret

# Initialize database
cd back-end
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Run backend (port 8000)
cd back-end && npm run start:dev

# Run frontend (Vite, port 8080)
cd front-end && npm run dev
```

### Multi-Tenant Mode

```bash
# Backend
TENANT_MODE=enabled PAYSTACK_SECRET_KEY=sk_test_... PAYSTACK_WEBHOOK_SECRET=whsec_... PAYSTACK_MODE=test node ./src/app.js

# Frontend
VITE_TENANT_MODE=enabled npm run dev
```

### Production Deployment

See `DEPLOYMENT-GUIDE.md` for Apache/Nginx + PM2 setup.

---

## Documentation

### Vault Documentation (Obsidian)
The full project documentation lives in the Obsidian vault at `/Users/kjsanni/Developments/macho/Restaurant Reservation System/`.

| Document | Description |
|---|---|
| `100-MOC-Architecture-Overview` | Master map of architecture, routes, and key files |
| `900-Session-Summary` | Development session history and current sprint status |
| `903-Tenant-Platform-Module` | Multi-tenant architecture, migrations, middleware, feature tracker |
| `905-Subscription-Pricing-Model` | GHS cost model, tiered pricing, BYOK gateway options |
| `906-BYOK-Onboarding-UI-Flow` | BYOK tenant onboarding design, gateway configuration UI, backend API spec |
| `907-WhatsApp-First-Delivery-Flow` | WhatsApp-native customer journey, location collection, ShaQ Express integration |
| `910-Legal-Compliance-System` | 9 Ghana-localised legal documents and compliance system |
| `911-Legal-Acceptance-Audit-Trail` | Tamper-evident acceptance records and onboarding enforcement |
| `902-Improvement-Recommendations` | Full audit findings (security, correctness, performance, UX) |
| `DEPLOYMENT-GUIDE.md` | Production setup guide |

### In-Repo Documentation
- `CHANGELOG.md` — Version history
- `SECURITY_AUDIT_REPORT.md` — Security findings and remediation
- `Specs/` — Implementation specs and production checklists
- `Sessions/` — Session notes and architecture decisions

---

## Configuration

### Environment Variables

```bash
# Backend
NODE_ENV=production
TENANT_MODE=enabled
REDIS_HOST=localhost
REDIS_PORT=6379
DB_HOST=localhost
DB_NAME=rtrs_production
DB_USER=rtrs_user
DB_PASSWORD=secure-password
JWT_SECRET=<32+ random chars>
CORS_ORIGINS=https://yourdomain.com

# Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
PAYSTACK_MODE=live

# WhatsApp Business API
WHATSAPP_APP_SECRET=<app secret>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<verify token>
WHATSAPP_PHONE_NUMBER_ID=<phone number id>

# ShaQ Express
SHAQ_EXPRESS_IDENTIFIER=<partner identifier>
SHAQ_EXPRESS_SECRET=<partner secret>
```

---

## Testing

```bash
# Backend
cd back-end && npm test

# Frontend unit tests
cd front-end && npm run test:unit

# Frontend accessibility
cd front-end && npm run test:a11y

# Frontend visual regression
cd front-end && npm run test:visual

# Frontend E2E
cd front-end && npm run test:e2e

# Backend load tests
cd back-end && npm run loadtest:baseline
```

---

## License

ISC

---

## Contact

GitHub [@kjsanni](https://github.com/kjsanni)

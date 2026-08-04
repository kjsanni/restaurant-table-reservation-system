# Restaurant Table Reservation System (RTRS)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/95072b74db194a008dcf326a386edcf8)](https://app.codacy.com/gh/kjsanni/restaurant-table-reservation-system?utm_source=github.com&utm_medium=referral&utm_content=kjsanni/restaurant-table-reservation-system&utm_campaign=Badge_Grade)

Multi-tenant SaaS platform built for the Ghanaian hospitality market, supporting both **restaurant** and **salon** business verticals. Platform offers WhatsApp-first ordering, ShaQ Express delivery integration, Paystack payments (GHS), and Ghana-localized legal compliance. Built with Node.js, Express, Sequelize, Vue 3, and BullMQ.

Repository: `https://github.com/kjsanni/restaurant-table-reservation-system`

---

## Project Summary

RTRS is a full-stack reservation platform that evolved from a single-tenant restaurant app into a multi-tenant SaaS serving both restaurants and salons. The platform provides:

- **Restaurant vertical**: table reservations, floor plans, waitlists, heatmap analytics, no-show tracking, customer loyalty
- **Salon vertical**: appointment booking, station management, service catalogs, client profiles, walk-in queues, recurring appointments, marketing campaigns, inventory & expenses
- **Multi-tenant platform**: feature-flagged tenant isolation, subscription billing, per-tenant branding, usage limits
- **Super-admin portal**: platform-wide tenant management, compliance oversight, analytics dashboards, support ticketing
- **Compliance & legal**: Ghana-localized legal documents (9 documents), DPA 2012 compliance, DSAR management, compliance automation
- **Payment integration**: Paystack (GHS — Mobile Money, cards, banks) with platform-managed accounts
- **Delivery integration**: ShaQ Express for package delivery tracking
- **WhatsApp integration**: Business API for messaging, ordering, reservations, notifications, delivery

---

## Business Verticals

### Restaurant Vertical
- **Reservation Management** — Create, edit, cancel, and seat guests with drag-and-drop floor plan and calendar views
- **Table Management** — Register tables with capacity, block/unblock, merge for large parties, assign staff
- **Waitlist Management** — Queue guests, auto-suggest seating when tables free up via Socket.io real-time updates
- **Schedule & Holidays** — Weekly opening hours, holiday closures, schedule enforcement on reservations
- **Heatmap Analytics** — 1D weekly + 2D date-hour reservation density matrices
- **No-Show Tracking** — One-click marking, stats widget, trend indicators
- **Customer Database** — Profiles, loyalty tags, visit history, preferences

### Salon Vertical
- **Appointment Management** — Book, reschedule, and cancel appointments with stylist assignment
- **Station Management** — Register salon stations, assign to zones, manage availability
- **Service Catalog** — Configurable services with duration, pricing, and stylist eligibility
- **Client Records** — Client profiles with visit history, VIP tiers, and preference tracking
- **Walk-In Queue** — Kanban board for walk-in appointment management
- **Recurring Appointments** — Scheduled appointments with repeat patterns
- **Marketing Campaigns** — WhatsApp-based campaigns with delivery analytics
- **Photo Gallery** — Client portfolio and stylist work showcases
- **Inventory & Expenses** — Product stock tracking and expense management
- **Dynamic Pricing Rules** — Configurable price adjustments per service/stylist/time

---

## Key Features

### Multi-Tenant SaaS Platform
- **Feature-Flagged Multi-Tenancy** — `TENANT_MODE=enabled`; single repo, zero overhead when disabled
- **Tenant Resolution** — Header (`X-Tenant-Id`, `X-Tenant-Slug`) or subdomain-based routing
- **Subscription Billing** — Paystack integration with starter/growth/enterprise plans, grace periods, auto-suspension
- **Per-Tenant Branding** — Logo, colors, theme, business hours, notification channels
- **Usage Limits** — Enforced per-plan limits for tables and reservations
- **Platform Admin Dashboard** — Create/manage tenants, view MRR, usage, revenue, bulk operations, support notes, trial management, invoices, billing emails, timeline, grace period, white-label, API keys, audit log, notifications, onboarding checklist

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
- **Platform Analytics** — Tenant growth metrics, churn analysis, LTV/CAC, revenue analytics, booking analytics, payment analytics, usage metrics

### Compliance & Legal (Ghana)
- **Compliance Automation** — Auto-fulfill simple DSAR requests, compliance reminder scheduling, automated compliance reports
- **9 Legal Documents** — Privacy, Terms, Cookies, GDPR, DPA, Customer, Tenant/Merchant, Payment & Refund, Accessibility
- **Tamper-Evident Acceptances** — Immutable `legal_acceptances` records with version tracking
- **Onboarding Enforcement** — Required Merchant Policy + DPA acceptance before going live
- **DPA 2012 Compliance** — Data Protection Act 2012 (Act 843) aligned; DPC framework

### RBAC & Security
- **Role-Based Access Control** — Tenant roles (Admin, Manager, Staff) and platform roles (Super Admin)
- **Group Management** — Create user groups with permission sets
- **Super Admin Portal** — Platform-wide tenant management, compliance oversight, analytics dashboards
- **Permission-Based UI** — Action buttons match backend `requirePermission` checks
- **JWT Authentication** — Secure tokens with rotation support
- **CSRF Protection** — Strict sameSite enforcement
- **CSP Headers** — Environment-aware content security policy
- **Account Lockout** — 5 failed attempts / 15-minute sliding window
- **Audit Logging** — Comprehensive trail for authentication and data mutations
- **Webhook Security** — HMAC-SHA512 signature verification for Paystack + ShaQ Express
- **Mass-Assignment Protection** — Explicit field allowlists on all mutation endpoints
- **SSRF Protection** — POS webhook URL validation against private/loopback hosts
- **TOTP Enforcement** — Mandatory 2FA for super-admin accounts

### Scheduling & Calendar
- **Schedule Management** — Weekly opening hours with toggle switches
- **Holiday Management** — Add/remove closed dates
- **Calendar View** — Visual calendar for opening hours and reservations, drag-to-create

### User & Role Management
- **Platform Role Management** — Assign/revoke platform roles (super-admin, tenant admin, manager, staff)
- **User Role Management** — Assign/remove/bulk-assign roles to users
- **Bulk Operations** — Suspend, change plan, send email to multiple tenants at once

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js 18+ + Express |
| Backend ORM | Sequelize + MySQL |
| Authentication | JWT with rotation (Tymon JWTAuth pattern) |
| Authorization | RBAC (roles, groups, granular permissions) |
| Real-time | Socket.io |
| Frontend Framework | Vue 3 (Composition API) + TypeScript |
| Frontend UI | Vuestic UI + CSS custom properties (brand tokens) |
| State Management | Pinia |
| Build Tool | Vite |
| Background Jobs | BullMQ + Redis |
| Cache | Redis |
| Payments | Paystack (GHS — Mobile Money, cards, banks) |
| Delivery | ShaQ Express API (`public-api.shaqexpress.com`) |
| Messaging | WhatsApp Business API (Meta) |
| Testing | Jest (backend), Vitest + Playwright (frontend) |
| Observability | Winston + Sentry |
| Deployment | PM2 + Apache/Nginx |

---

## Project Structure

```
restaurant-table-reservation-system/
├── back-end/
│   ├── src/
│   │   ├── routes/              # Domain routers + tenant-platform routes
│   │   ├── controllers/          # Controllers (auth, tenant, admin, verticals)
│   │   ├── services/            # Business logic services
│   │   ├── DAOs/                # Data access objects
│   │   ├── middleware/          # Auth, RBAC, CSRF, rate-limit, audit, tenant resolution
│   │   ├── db/
│   │   │   ├── models/          # Sequelize models (tenant, user, reservation, payment, etc.)
│   │   │   ├── migrations/      # Sequelize migrations (24+)
│   │   │   └── seeders/         # Data seeders
│   │   ├── queues/              # BullMQ workers (notification, report)
│   │   ├── tenant-platform/     # Multi-tenant module (gated by TENANT_MODE=enabled)
│   │   │   ├── controllers/     # Compliance, DSAR, audit, legal acceptances
│   │   │   ├── routes/          # Admin compliance, analytics, legal routes
│   │   │   ├── DAOs/            # Tenant-scoped data access
│   │   │   ├── services/        # Tenant-scoped business logic
│   │   │   ├── DAOs/            # Tenant-scoped data access
│   │   │   └── middleware/      # Tenant resolution, subscription gating
│   │   ├── verticals/           # Salon vertical (models, DAOs, controllers, routes)
│   │   └── utils/               # Server bootstrap, JWT rotation, route helpers
│   ├── ecosystem.config.js      # PM2 production config
│   └── postman_collection.json  # Full API collection for testing
├── front-end/
│   ├── src/
│   │   ├── views/               # 40+ page views (admin, tenant, customer, salon)
│   │   ├── components/          # 33+ reusable components
│   │   ├── router/              # Vue Router routes
│   │   ├── stores/              # Pinia stores (auth, tenant)
│   │   ├── services/            # API service files
│   │   └── assets/              # Branding CSS, design tokens
│   └── index.html
├── legal/                       # 9 Ghana-localised legal documents
├── Specs/                       # Implementation specs and checklists
├── DEPLOYMENT-GUIDE.md          # Production setup (Apache/Nginx + PM2)
├── CHANGELOG.md                 # Version history
├── SECURITY_AUDIT_REPORT.md     # Security findings and remediation
└── VERSION                      # Current version string
```

---

## Current Status

### Test Coverage
- **Backend:** 655+ Jest tests passing (1 pre-existing failure in `salon-cron.test.js`)
- **Frontend:** 22+ Vitest unit tests passing, lint + build clean
- **Multi-tenant E2E:** 110/110 tests pass
- **Playwright a11y:** 21/21 tests passing

### Super Admin Portal
- Platform role management, user role management, full analytics dashboard
- Compliance automation (DSAR auto-fulfillment, reminders, reporting)
- Advanced analytics endpoints (revenue, bookings, payments, usage)
- Support ticket system with SLA tracking, CSAT surveys, chat
- Integration analytics for Paystack, WhatsApp, ShaQ Express

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
```

---

## License

ISC

---

## Contact

GitHub [@kjsanni](https://github.com/kjsanni)
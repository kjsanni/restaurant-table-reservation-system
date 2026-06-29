<h1 align="center">
<img src="https://github.com/slavyanHristov/restaurant-table-reservation-system/blob/feature/readme/screenshots/rtrs.png" width="300" />
<br>
Restaurant Table Reservation System - RTRS
<br>
</h1>

<h4 align="center">Table reservation web app for any restaurant with RBAC, payments, analytics, and real-time waitlist management</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credentials">Default Credentials</a> •
  <a href="#security">Security</a> •
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
| Testing | Playwright (E2E) |

---

## How To Use

### Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
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

---

## Contact

> GitHub [@kjsanni](https://github.com/kjsanni)

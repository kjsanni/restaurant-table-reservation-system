# Super-Admin Role Splitting + Salon Customer Ownership Enforcement: Implementation Plan

## P0 Items

1. **Super-admin role hierarchy enforcement** — implement ADR-0002.
2. **Salon + restaurant customer ownership enforcement** — close portal authorization gaps.

---

## P0-1: Super-Admin Role Hierarchy Enforcement

### Scope

Formalize the three-tier platform-actor model from ADR-0002:
- Super admin (`isSuperAdmin === true`)
- Platform admin (`platformRoles` includes `platform_admin`)
- Platform staff (`platformRoles` includes `platform_billing`, `platform_support`, `platform_technical`, `platform_compliance`)

### Tasks

#### T1.1 Update `requireSuperAdmin` middleware

**File:** `back-end/src/middleware/auth.js`

- Remove the `platform_admin` fallback from `requireSuperAdmin` (lines 97–105).
- Keep the audit log on rejection.
- New logic:
  ```js
  const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.isSuperAdmin) {
      return next();
    }
    // audit log + 403
  };
  ```

#### T1.2 Update `requirePlatformRole` middleware

**File:** `back-end/src/middleware/auth.js`

- Replace the current flat `includes` check with a hierarchy check.
- Hierarchy: `platform_admin` > `platform_billing` > `platform_support` > `platform_technical` > `platform_compliance`.
- `isSuperAdmin` bypasses all checks.
- Pseudocode:
  ```js
  const ROLE_HIERARCHY = {
    platform_admin: 5,
    platform_billing: 4,
    platform_support: 3,
    platform_technical: 2,
    platform_compliance: 1,
  };
  const requirePlatformRole = (role) => {
    return (req, res, next) => {
      const userRoles = Array.isArray(req.user?.platformRoles) ? req.user.platformRoles : [];
      const hasSuperAdmin = req.user?.isSuperAdmin;
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      const userMaxLevel = Math.max(0, ...userRoles.map(r => ROLE_HIERARCHY[r] || 0));
      if (hasSuperAdmin || userMaxLevel >= requiredLevel) {
        return next();
      }
      // audit log + 403
    };
  };
  ```

#### T1.3 Audit and downgrade over-privileged routes

**Files:** `back-end/src/tenant-platform/routes/*.router.js`, `back-end/src/middleware/adminMiddleware.js`

Current `requireSuperAdmin` usages (non-test):
- `adminMiddleware.js` — used for admin portal; likely stays `requireSuperAdmin`
- `supportTicketAnalytics.router.js` — downgrade to `requirePlatformRole("platform_support")` or `requirePlatformRole("platform_admin")`
- `reconciliation.router.js` — downgrade to `requirePlatformRole("platform_billing")` or `requirePlatformRole("platform_admin")`
- `encryptionKey.router.js` — keep `requireSuperAdmin`
- `insuranceDocument.router.js` — downgrade to `requirePlatformRole("platform_compliance")` or `requirePlatformRole("platform_admin")`
- `shaqExpressConversion.router.js` — downgrade to `requirePlatformRole("platform_admin")` (operational)
- `caseStudy.router.js` — downgrade to `requirePlatformRole("platform_admin")` (operational)

#### T1.4 Add tests

**File:** `back-end/__tests__/requireSuperAdmin.test.js` (new or update existing)

Test matrix:
| Actor | Route | Expected |
|-------|-------|----------|
| `isSuperAdmin=true` | super-admin route | 200 |
| `isSuperAdmin=true` | platform_billing route | 200 |
| `platform_admin` | super-admin route | 403 |
| `platform_admin` | platform_billing route | 200 |
| `platform_billing` | super-admin route | 403 |
| `platform_billing` | platform_billing route | 200 |
| `platform_billing` | platform_support route | 403 |
| `platform_support` | platform_support route | 200 |
| No platform roles | any platform route | 403 |

#### T1.5 Frontend sidebar gating

**File:** `front-end/src/config/sidebarItems.ts`

- Add `requiredPlatformRole?: string` to sidebar item configs.
- In the sidebar render logic, hide items where `requiredPlatformRole` is set and the user's `platformRoles` does not include it (or `isSuperAdmin` is not true).

### Verification

| Check | Command | Expected |
|-------|---------|----------|
| Backend tests | `cd back-end && npm test` | All existing + new tests pass |
| Frontend build | `cd front-end && npm run build` | Clean build |

---

## P0-2: Salon + Restaurant Customer Ownership Enforcement

### Ownership Enforcement Scope

Close authorization gaps in customer-facing portal routes so that customers can only access their own data.

### Current Ownership Map

#### Restaurant Customer Portal (`/api/v1/customer-portal`)

| Endpoint | Controller | Ownership Check | Gap |
|----------|-----------|-----------------|-----|
| `GET /profile` | `getCustomerProfileHandler` | Resolves customer by authenticated user email, tenant-scoped | None |
| `PATCH /profile` | `updateCustomerProfileHandler` | Same as above | None |
| `GET /reservations` | `getCustomerReservationsHandler` | Filters by `customerId` | None |
| `POST /reservations/:id/cancel` | `cancelReservationHandler` | **MISSING** — cancels any reservation by ID+tenant without verifying `reservation.customerId === customer.id` | **GAP** |
| `GET /waitlist` | `getCustomerWaitlistHandler` | Filters by `customerId` | None |
| `POST /waitlist` | `joinWaitlistHandler` | Creates for authenticated customer | None |
| `POST /waitlist/:id/cancel` | `cancelWaitlistEntryHandler` | Checks `entry.customerId !== customer.id` | None |
| `GET /loyalty` | `getLoyaltyHandler` | Tenant + customer scoped | None |
| `POST /loyalty/redeem` | `redeemPointsHandler` | Tenant + customer scoped | None |
| `GET /promotions` | `getPromotionsHandler` | Tenant-scoped public data | None |
| `GET /promotions/:id` | `getPromotionHandler` | Tenant-scoped public data | None |

#### Salon Customer Portal (`/api/v1/salon-customer-portal`)

| Endpoint | Controller | Ownership Check | Gap |
|----------|-----------|-----------------|-----|
| `GET /profile` | `getSalonCustomerProfileHandler` | Resolves by user email, tenant-scoped | None |
| `GET /appointments` | `getSalonCustomerAppointmentsHandler` | Filters by `customerId` | None |
| `POST /appointments/:id/cancel` | `cancelSalonAppointmentHandler` | Checks `appointment.customerId !== customer.id && role !== admin && role !== staff` | Staff bypass allowed — **review** |
| `POST /appointments/:id/rebook` | `rebookSalonAppointmentHandler` | Same pattern as cancel | Staff bypass allowed — **review** |
| `GET /gift-cards` | `getCustomerGiftCardsHandler` | Filters by customer ownership | None |
| `GET /referrals` | `getCustomerReferralsHandler` | Filters by customer ownership | None |
| `GET /packages` | `listServicePackagesHandler` | Tenant-scoped public data | None |
| `GET /pricing-rules` | `listPricingRulesHandler` | Tenant-scoped public data | None |

### Ownership Enforcement Tasks

#### T2.1 Fix restaurant reservation cancellation ownership

**File:** `back-end/src/controllers/customer-portal.controller.js`

In `cancelReservationHandler`:
1. After resolving the reservation by ID+tenant, resolve the customer from `req.user`.
2. Add ownership check:
   ```js
   if (reservation.customerId !== customer.id) {
     return res.status(403).json({ success: false, message: "Not authorized for this reservation" });
   }
   ```
3. Keep the existing status checks (`cancelled`, `completed`).

#### T2.2 Review salon staff bypass on cancel/rebook

**File:** `back-end/src/controllers/salon-customer-portal.controller.js`

Current logic in `cancelSalonAppointmentHandler` and `rebookSalonAppointmentHandler`:
```js
if (appointment.customerId !== customer.id && req.user?.role !== "admin" && req.user?.role !== "staff") {
  return res.status(403).json(...);
}
```

**Decision needed:** Should tenant `admin` and `staff` be able to cancel/rebook any customer's appointment via the customer portal?

- **If yes (current behavior is intentional):** Document the rationale in the controller comments and ensure the route is not advertised as customer-self-service only.
- **If no (should be customer-only):** Remove the `admin`/`staff` bypass and enforce strict ownership.

**Recommended:** Keep the bypass for tenant `admin` (they should be able to manage appointments), but remove it for `staff` unless there is a specific business requirement. Staff should use the admin dashboard, not the customer portal.

#### T2.3 Add integration tests for ownership gaps

**File:** `back-end/__tests__/customer-portal.ownership.test.js` (new)

Test cases:
1. Customer A cancels their own reservation → 200
2. Customer A cancels Customer B's reservation → 403
3. Staff cancels any reservation via customer portal → 403 (after T2.2 fix)
4. Salon customer cancels own appointment → 200
5. Salon customer cancels another customer's appointment → 403

### Ownership Enforcement Verification

| Check | Command | Expected |
|-------|---------|----------|
| Backend tests | `cd back-end && npm test` | All tests pass, new ownership tests pass |
| Frontend build | `cd front-end && npm run build` | Clean build |

---

## Execution Order

1. **P0-1 first** — role hierarchy is a security boundary that affects all platform routes.
2. **P0-2 second** — ownership fixes are isolated to customer portal controllers and tests.

## Out of Scope

- Super-admin invitation flow (defer until >1 super admin is required).
- Platform role assignment UI in frontend (controller exists; frontend is future work).
- Restaurant customer portal route restructuring (current routing is acceptable; only the cancellation ownership gap needs fixing).
- Salon customer portal route restructuring.

## References

- **REF-001**: `Specs/ADR-0002-super-admin-role-hierarchy.md`
- **REF-002**: `Specs/ADR-0001-separate-actor-entry-points.md`
- **REF-003**: `Specs/004-super-admin-role-separation.md`
- **REF-004**: `back-end/src/middleware/auth.js`
- **REF-005**: `back-end/src/controllers/customer-portal.controller.js`
- **REF-006**: `back-end/src/controllers/salon-customer-portal.controller.js`
- **REF-007**: `back-end/src/controllers/platform-role.controller.js`

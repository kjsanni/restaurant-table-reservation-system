# Threat Model — Event Vertical

**Date:** 2026-08-13  
**Scope:** Event vertical module (events, ticket types, guest lists, QR codes, event bookings)  
**Methodology:** STRIDE per element, mapped to MITRE ATT&CK  
**Focus Areas:** Booking isolation, payment integrity, QR code security, capacity enforcement, cross-tenant data leakage

---

## 1. Assets and Entry Points

### Assets
| Asset | Sensitivity | Location |
|-------|------------|----------|
| Event booking PII (guest name, email, phone) | High | `event_bookings` table |
| Payment references and Paystack metadata | High | `event_bookings.paymentReference`, `metadata` |
| QR code tokens (check-in secrets) | High | `qr_codes.code` |
| Event capacity and ticket inventory | Medium | `events.capacity`, `ticket_types.quantity` |
| Guest list data | Medium | `guest_lists` table |
| Platform payment credentials | Critical | Existing Paystack integration |

### Entry Points
| Entry Point | Public/Auth | Description |
|-------------|-------------|-------------|
| `/api/v1/events` | Auth | Event CRUD (tenant-scoped) |
| `/api/v1/events/:id/bookings` | Auth | Booking management |
| `/api/v1/events/bookings/:id/transfer` | Auth | Ticket transfer |
| `/api/v1/events/checkin/:code` | Auth (staff) | QR code check-in |
| `/api/v1/webhooks/paystack` | Public (signed) | Payment confirmation |

---

## 2. Threat Actor Profiles

| Actor | Capabilities | Motivation | Primary Targets |
|-------|-------------|------------|-----------------|
| Malicious Insider | Valid tenant creds, event knowledge | Revenge, fraud | B, D, R |
| External Attacker | Public scanning, payment reference guessing | Financial, data theft | S, I, E |
| Compromised Tenant | Legitimate tenant account | Lateral movement, capacity manipulation | I, T, E |
| Customer | Public event access | Unauthorized check-in, data access | S, I |

---

## 3. Data Flow and Trust Boundaries

```
Customer → [Event Portal] → [Event Routes] → [Booking Service] → [EventBooking DAO] → Database
                                              ↓
                                       [Paystack] → [Webhook] → [Booking Confirmation]
                                              ↓
                                       [QR Check-in] → [Staff Auth] → [Guest List Update]
```

### Trust Boundaries
1. **Public → Authenticated**: `protect` middleware, JWT verification
2. **Customer → Tenant Staff**: `requirePermission` checks
3. **Payment Webhook**: HMAC signature verification
4. **Database**: Tenant-scoped queries via `req.tenant.id`

---

## 4. STRIDE Analysis by Component

### 4.1 Event Booking Flow
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Customer impersonates another guest using known booking reference | `findByReference` now requires `tenantId`; DAO scoped to authenticated tenant |
| Tampering | Booking status modified mid-flow | Explicit state transitions in service; immutable payment reference after creation |
| Repudiation | Customer denies booking | Payment reference logged; Paystack webhook provides external proof |
| Info Disclosure | Event capacity leaked to competitors | Events are tenant-scoped; only visible to authenticated users of that tenant |
| DoS | Mass booking creation to exhaust capacity | Capacity check in service layer; 400 response when full |
| Elevation | Customer accesses another tenant's bookings | `tenantId` required on all DAO queries; fixed M-1 from security review |

### 4.2 QR Code Check-in
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Fake QR code generated | 128-bit random codes; no predictable pattern |
| Tampering | QR code reused after check-in | Status transitions `active → used`; `used` codes rejected |
| Repudiation | Guest claims they checked in | `checkedInAt` timestamp + `checkedInById` staff ID logged |
| Info Disclosure | QR code brute-forced | No rate limiting yet (L-3 recommendation); low probability with 128-bit space |
| DoS | QR code endpoint flooded | Underlying rate limiter on API routes |
| Elevation | Customer generates QR codes | `/checkin/:code` requires staff authentication |

### 4.3 Payment Integration
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Fake payment webhook accepted | Paystack HMAC signature verification |
| Tampering | Payment amount modified | Amount validated server-side against ticket type price |
| Repudiation | Disputed payment | Paystack transaction record is authoritative |
| Info Disclosure | Payment metadata leaked | Sensitive fields excluded from API responses |
| DoS | Webhook replay attack | Idempotent processing; duplicate webhooks return existing booking |
| Elevation | Webhook processes booking for wrong tenant | `metadata.tenantId` validated against webhook context |

### 4.4 Ticket Transfer
| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Unauthorized transfer | Original booking owner validated via `customerId` |
| Tampering | Transfer after event start | >24h policy enforced server-side |
| Repudiation | Transfer denied | `transferHistory` metadata logged with timestamp and recipient |
| Info Disclosure | Transfer history leaked | Only visible to booking owner and tenant staff |
| DoS | Mass transfer requests | Rate limited by underlying API limiter |
| Elevation | Transfer to unapproved guest | No additional validation beyond email/phone; acceptable for v1 |

---

## 5. Threat Register

| ID | STRIDE | Description | Component | ATT&CK | Likelihood | Impact | Severity | Mitigation | Status |
|----|--------|-------------|-----------|--------|------------|--------|----------|------------|--------|
| E-01 | Spoofing | Cross-tenant booking access via payment reference | DAO | T1078 | Medium | High | High | `tenantId` required; DAO scoped | Mitigated |
| E-02 | Elevation | Customer accesses another tenant's events | DAO | T1068 | Medium | Critical | Critical | Tenant-scoped queries | Mitigated |
| E-03 | Tampering | QR code replay after check-in | QR Codes | T1565 | Medium | Medium | Medium | Status transition to `used` | Mitigated |
| E-04 | Tampering | Fake Paystack webhook accepted | Webhooks | T1565 | Low | High | Medium | HMAC verification | Mitigated |
| E-05 | DoS | Capacity exhaustion via mass bookings | Bookings | T1499 | Medium | Low | Low | Service-level capacity check | Mitigated |
| E-06 | Info Disclosure | Event data leaked to unauthenticated users | API | T1530 | Low | Medium | Low | `protect` middleware | Mitigated |
| E-07 | Elevation | Customer performs staff check-in | Check-in | T1548 | Low | High | Medium | Staff auth required | Mitigated |
| E-08 | Tampering | Transfer after event start | Transfers | T1565 | Medium | Medium | Medium | >24h server-side policy | Mitigated |
| E-09 | DoS | QR code brute-forcing | QR Codes | T1499 | Low | Low | Low | 128-bit randomness | Accepted |
| E-10 | Repudiation | Transfer denied by recipient | Transfers | T1070 | Low | Low | Low | Metadata logging | Accepted |

---

## 6. MITRE ATT&CK Mapping

| ATT&CK ID | Technique | Mitigated? |
|-----------|-----------|------------|
| T1078 | Valid Accounts | ✅ JWT + tenant scoping |
| T1068 | Exploitation for Priv Esc | ✅ Tenant-scoped DAOs |
| T1565 | Data Manipulation | ✅ State transitions, HMAC verification |
| T1499 | Endpoint DoS | ✅ Capacity checks, rate limiting |
| T1530 | Data from Cloud | ✅ Auth middleware on all routes |
| T1548 | Abuse Elevation Control | ✅ Permission checks |
| T1070 | Indicator Removal | ⚠️ Metadata logging partial |

---

## 7. Prioritized Mitigations

### Critical (Immediate)
- None currently unmitigated

### High
- None currently unmitigated

### Medium
- **E-09**: QR code brute-forcing — Add rate limiting on `/checkin/:code` endpoint
- **E-03**: QR code replay — Add nonce or single-use token validation at DAO level

### Low
- **E-10**: Transfer repudiation — Expand transfer history to separate table with immutable audit log

---

## 8. Recommendations

1. **Rate limit QR check-in** — Add specific rate limiter for `/checkin/:code` to prevent brute-force
2. **DAO-level QR status check** — Use atomic `UPDATE ... WHERE status = 'active'` to prevent race-condition replay
3. **Transfer audit table** — Create `event_booking_transfers` table for immutable transfer history
4. **Capacity atomicity** — Consider `SELECT ... FOR UPDATE` or Redis lock for high-concurrency booking scenarios
5. **STRIDE review per event PR** — Integrate threat modeling into event vertical PR review process

---

## 9. Verification

- [x] Security review completed (`Specs/event-vertical-security-review.md`)
- [x] M-1 IDOR fix verified (DAO requires `tenantId`)
- [x] Backend tests pass: event controller suite 22/22
- [ ] Playwright E2E tests executed against live instance
- [ ] Cross-tenant booking isolation tests added
- [ ] QR code rate limiting implemented

---
title: Security Fixes
date: 2026-06-29
tags:
  - security
  - backend
  - fixes
  - csrf
  - cors
  - jwt
  - csp
related:
  - "[[100-MOC-Architecture-Overview]]"
  - "[[202-Backend-Architecture]]"
  - "[[501-Security-Fixes]]"
  - "[[702-Login-Lockout]]"
  - "[[701-Audit-Log]]"
---

# Security Fixes

> [!warning] Security Posture
> These changes harden the application against common attacks. See `SECURITY_AUDIT_REPORT.md` for full audit findings.

---

## CSRF Protection

- `back-end/src/middleware/csrf.js`
- **SameSite: "strict"** enforcement
- Cookie-based `XSRF-TOKEN` with `setCsrfCookie` middleware
- Apple-preview `samesite=none; secure` behavior maintained
- Endpoint: `GET /api/v1/csrf-token` for token refresh
- Axios interceptor on frontend reads cookie and sets `x-xsrf-token` header

---

## CORS Configuration

- **Origin validation** against `CORS_ORIGINS` env var
- Rejects wildcard (`*`) in production
- Defaults to `["http://localhost:8080"]` when env var is empty
- Applied in `back-end/src/utils/server.js` with `credentials: true`

---

## JWT Security

| Feature | Detail |
|---|---|
| Secret Length | 256-bit |
| Token Rotation | Supported via `getCurrentSecret` / `jwtRotation.js` |
| Fallback Verification | Supports rotation without immediate invalidation |
| Storage | `back-end/src/services/authService.js` |
| HttpOnly Cookies | Not implemented (tokens in `Authorization` header or cookies) |

> [!danger] Critical
> `SECURITY_AUDIT_REPORT.md` identifies hardcoded JWT secret as a critical vulnerability requiring immediate remediation.

---

## CSP Headers

- `back-end/src/middleware/csp.js` with environment-aware directives
- Production: Stricter `content-security-policy`
- Development: Looser restrictions for local dev
- Combined with `helmet` middleware for additional security headers
- `crossOriginResourcePolicy: false` to allow font loading

---

## Account Lockout

| Parameter | Value |
|---|---|
| Max Attempts | 5 failed attempts |
| Lockout Duration | 15 minutes |
| Cleanup Strategy | Automatic expiration |
| Tracking Table | `login_attempts` |
| Components | Table + Model + DAO + behavioral logic in `authService.js` |

> [!info] Related
> See [[702-Login-Lockout]] for implementation details

---

## Rate Limiting

- `back-end/src/middleware/rateLimit.js`
- Protects API endpoints from brute-force
- Combined with login lockout for authentication endpoints

---

## Input Sanitization

- `back-end/src/middleware/sanitize.js` - XSS prevention
- `InputValidationService` - Custom validation with malicious pattern detection
- Phone validation: 10–15 digits
- Business logic validators prevent injection in reservation fields

---

## Audit Logging

> [!info] Related
> See [[701-Audit-Log]] for implementation details

- Captures `auth_failed` for 401/403 responses
- `auditLog.js` middleware logs CRUD operations on reservations, tables, RBAC
- No sensitive data logged (passwords, tokens)
- Persistent storage for compliance

---

## Other Security Hardening

- `.env.production` ignored in `.gitignore`
- `.env.production.example` committed as safe template
- Enhanced audit logging for 401/403 responses
- Soft-delete pattern preserves audit trail without exposing deleted data
- `SecureErrorHandler` prevents information leakage in error responses
- HTTP method enforcement via `httpMethodError` middleware

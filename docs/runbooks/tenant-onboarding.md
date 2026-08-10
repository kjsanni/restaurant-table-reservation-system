# Tenant Onboarding Runbook

## 1. Signup

- Tenant submits signup form via customer portal.
- System creates tenant record with `status = active` and default `plan = starter`.
- Platform sends welcome email with tenant admin credentials.

## 2. Payment

- Tenant is redirected to Paystack for payment.
- On success, Paystack webhook updates `subscriptionStatus = active`.
- If payment fails, tenant remains in `past_due` status and receives reminder.

## 3. Provisioning

- `seedSalonSettings` runs for salon verticals.
- Default feature flags are applied from `tenantTypeDefaults.service`.
- Tenant admin receives onboarding wizard link.

## 4. First Reservation

- Tenant configures tables, staff, and schedules.
- System sends test reservation confirmation via WhatsApp/email.
- Tenant verifies end-to-end flow.

## 5. Go-Live Checklist

- [ ] Payment method verified
- [ ] Feature flags configured
- [ ] Staff accounts created
- [ ] Tables and floor plan set up
- [ ] Notification channels tested (WhatsApp, email)
- [ ] Legal acceptances signed

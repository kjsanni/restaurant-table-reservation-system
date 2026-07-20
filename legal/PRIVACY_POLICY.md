# Privacy Policy

**Last updated:** 20 July 2026

## 1. Who we are

The Restaurant Table Reservation System ("RTRS", "the Service", "we", "us") is operated by **Vibespot Technologies Ltd.**, a company incorporated in the **Republic of Ghana** ("the Company", "Data Controller").

- **Data Controller:** Vibespot Technologies Ltd. (Ghana)
- **Contact for privacy matters:** privacy@vibespot.tech
- **Supervisory authority:** The Data Protection Commission of Ghana (DPC), established under the Data Protection Act, 2012 (Act 843).

RTRS is a multi-tenant software-as-a-service platform that lets restaurants in Ghana manage table reservations, waitlists, schedules, customers, staff, and payments. Each restaurant ("Tenant") is itself a controller of the personal data of its own guests and staff, and is responsible for its own lawful basis and transparency obligations toward those individuals under the Data Protection Act, 2012 (Act 843).

> **Important:** When you make a reservation at a restaurant that uses RTRS, that restaurant (not Vibespot Technologies Ltd.) is primarily responsible for how your data is used. This policy explains how Vibespot Technologies Ltd. processes data as the platform provider. You should also review the privacy notice provided by the specific restaurant.

## 2. Scope of this policy

This policy covers personal data processed by Vibespot Technologies Ltd. in operating the RTRS platform, including data entered by restaurant administrators, managers, and staff (Tenant users), data entered by restaurant guests/customers (through booking forms, customer portals, and waitlists), and technical and usage data generated when the Service is used.

## 3. Legal framework

Our processing of personal data is governed by the **Data Protection Act, 2012 (Act 843)** of Ghana, and where we process data relating to individuals in the EU/UK, also by the GDPR as described in our [GDPR Compliance Statement](./GDPR_COMPLIANCE.md). We apply data-protection-by-design principles consistent with both frameworks.

## 4. What data we collect

### 4.1 Data provided by Tenants and their staff
- Account data: name, email address, username, role, and password (hashed).
- Profile/configuration data: business name, branding, business hours, currency (default Ghana Cedi — GHS), and notification settings.
- Billing data: subscription plan, billing contact details, and invoicing records (for paid Tenants).

### 4.2 Data provided about restaurant guests/customers
- Identity & contact: full name, phone number (often a Ghana mobile number, e.g. MTN, Vodafone, AirtelTigo), email address, party size, and reservation notes.
- Reservation data: date, time, duration, table assignment, status, and history.
- Loyalty/segmentation tags and no-show records.
- Payment records where a deposit or payment is taken in GHS (see Section 7).

### 4.3 Data collected automatically
- Device and connection data: IP address, browser type, and operating system.
- Usage data: pages and features accessed, authentication events, and audit logs.
- Cookies and similar technologies (see our [Cookie Policy](./COOKIE_POLICY.md)).

## 5. Why we process your data (purposes & lawful basis)

| Purpose | Data used | Lawful basis (Act 843 / GDPR) |
|---|---|---|
| Provide and operate the reservation Service | Account, reservation, usage data | Performance of a contract |
| Authenticate users and secure accounts | Credentials, IP, audit logs | Legitimate interests |
| Send reservation, waitlist, and service notifications (including SMS/WhatsApp) | Contact, reservation data | Performance of a contract / legitimate interests |
| Process subscription payments (GHS) | Billing, payment data | Performance of a contract |
| Comply with legal obligations (tax, accounting, Bank of Ghana record-keeping) | Billing, audit logs | Legal obligation |
| Improve and secure the Service | Usage, device data | Legitimate interests |

Where we rely on consent (e.g. optional marketing communications), you may withdraw it at any time.

## 6. How we share your data

We do **not** sell your personal data. We share data only with:

- **Restaurant Tenants** — so they can serve and manage your reservation.
- **Payment processors** — Paystack processes payments on our behalf in Ghana. See Section 7.
- **Infrastructure & service providers** — hosting, database (MySQL), caching/queue (Redis), SMS/email delivery, and analytics, under data processing agreements.
- **Authorities** — where required by Ghanaian law or to protect rights, safety, and property.

For data transferred outside Ghana, we apply appropriate safeguards consistent with the Data Protection Act, 2012.

## 7. Payments (Ghana)

Payments are processed by **Paystack**, a leading payments provider in Ghana that enables collections in **Ghana Cedi (GHS)** via Mobile Money (MTN, Vodafone Cash, AirtelTigo Money), cards, and bank channels. When you make a payment, your financial data is collected and processed directly by Paystack under its own privacy policy and PCI-DSS compliance. We store only non-sensitive payment metadata (amount in GHS, status, reference) needed to reconcile reservations. All payment processing is conducted in line with applicable **Bank of Ghana** directives on electronic money and payment services.

## 8. Data retention

- **Account & configuration data:** retained for the life of the Tenant account, and deleted within 90 days of account closure.
- **Guest reservation data:** retained according to each Tenant's retention settings, and for no longer than necessary for the purposes collected.
- **Audit logs:** retained for up to 24 months for security and compliance.
- **Billing records:** retained for the period required by applicable Ghanaian tax and accounting law.

Upon a verified deletion request, we delete or anonymise data unless retention is required by law.

## 9. Your rights

Under the Data Protection Act, 2012 (Act 843), you have the right to be informed, access, rectify, erase, restrict, port, and object to processing of your personal data, and to withdraw consent. You may also lodge a complaint with the **Data Protection Commission of Ghana** (https://dpc.gov.gh).

To exercise these rights, email **privacy@vibespot.tech**. We respond within statutory timeframes.

## 10. Security

We protect personal data with JWT authentication with rotation, role-based access control, rate limiting, CSRF protection, content-security-policy headers, account lockout, encrypted secrets, and audit logging. No method of transmission or storage is 100% secure; we maintain controls commensurate with the risk.

## 11. Children

The Service is not directed to children under 18, and we do not knowingly collect their personal data without parental consent.

## 12. Changes to this policy

We may update this policy from time to time. Material changes will be announced via the Service or by email where required. The "Last updated" date reflects the latest revision.

## 13. Contact

Vibespot Technologies Ltd. (Ghana)
Privacy enquiries: **privacy@vibespot.tech**

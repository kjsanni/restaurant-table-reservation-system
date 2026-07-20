# GDPR Compliance Statement

**Last updated:** 20 July 2026

This statement describes how **Vibespot Technologies Ltd.** ("we", "us"), as a data processor/platform provider for restaurant Tenants and a data controller for platform-level data, meets its obligations under the EU General Data Protection Regulation (Regulation (EU) 2016/679) and the UK GDPR — applicable where we process personal data relating to individuals in the EEA or UK.

> **For Ghana:** Our primary data-protection framework is the **Data Protection Act, 2012 (Act 843)** of Ghana, supervised by the **Data Protection Commission of Ghana**. See our [Privacy Policy](./PRIVACY_POLICY.md) for Ghana-specific commitments.

## 1. Roles

- **Vibespot Technologies Ltd. — Platform Provider / Joint Controller for platform data.** We determine the means and purposes for account, security, billing, and Service-operational processing.
- **Restaurant Tenants — Independent Controllers.** Each restaurant determines the means and purposes for processing its guests' and staff's personal data within its own RTRS workspace. Tenants are responsible for their own lawful basis, privacy notices, and data-subject requests relating to their guests.

## 2. Lawful bases

We rely on the lawful bases set out in our [Privacy Policy](./PRIVACY_POLICY.md): contract (Art. 6(1)(b)), legitimate interests (Art. 6(1)(f)), legal obligation (Art. 6(1)(c)), and consent where applicable.

## 3. Data subject rights

Data subjects in the EEA/UK have the right to:
- **Access** (Art. 15) — obtain confirmation and a copy of their personal data.
- **Rectification** (Art. 16) — correct inaccurate or incomplete data.
- **Erasure** (Art. 17) — deletion ("right to be forgotten") where no overriding ground applies.
- **Restriction** (Art. 18) — limit processing in defined circumstances.
- **Portability** (Art. 20) — receive data in a structured, machine-readable format.
- **Object** (Art. 21) — object to processing based on legitimate interests or direct marketing.
- **Withdraw consent** at any time where processing is consent-based.
- **Lodge a complaint** with a supervisory authority (e.g. your local Data Protection Authority, or the UK ICO).

Requests can be submitted to **privacy@vibespot.tech**. We verify the requester's identity and respond within **one month** (extendable by two further months for complex requests, with notice). Where a request concerns a Tenant's guest data, we will direct or coordinate with the relevant Tenant as controller.

## 4. International transfers

Where personal data is transferred outside the EEA/UK, we use appropriate safeguards such as **Standard Contractual Clauses (SCCs)** and UK International Data Transfer Agreements, supported by technical measures (encryption, access controls). Sub-processors (hosting, database, queue/cache, email/SMS, payments) are bound by written data processing terms.

## 5. Sub-processors

Categories of sub-processors include:
- Cloud hosting / infrastructure provider
- Database (MySQL) and cache/queue (Redis) services
- Email and SMS/WhatsApp delivery providers (e.g. for Ghana mobile networks)
- Payment processor: **Paystack** (Stripe)
- Analytics / error-monitoring (where enabled)

A current sub-processor list is available on request at **privacy@vibespot.tech**.

## 6. Security measures

- JWT authentication with rotation and short-lived sessions.
- Role-based access control and granular permissions.
- Rate limiting and account lockout (5 failed attempts / 15-minute lockout).
- CSRF protection and environment-aware Content Security Policy (CSP).
- Audit logging of authentication and data-mutation events.
- Encrypted configuration secrets; no secrets committed to source control.
- Network isolation via reverse proxy (Apache/Nginx) in production.

## 7. Data breach notification

In the event of a personal data breach, we will notify the competent supervisory authority within **72 hours** where required, and affected controllers/data subjects without undue delay where the breach is likely to result in a high risk to their rights and freedoms.

## 8. Data Protection by Design

RTRS applies tenant isolation (composite unique indexes, tenant-scoped queries), least-privilege roles, and configurable retention. Tenants are encouraged to minimise the data they collect and to set appropriate retention periods.

## 9. Contact

Data Protection enquiries:
**Vibespot Technologies Ltd.** (Ghana)
**privacy@vibespot.tech**

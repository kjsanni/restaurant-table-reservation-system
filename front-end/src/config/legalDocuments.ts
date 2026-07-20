export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  slug: string;
  title: string;
  lastUpdated: string;
  description: string;
  sections: LegalSection[];
}

export const legalDocuments: Record<string, LegalDocument> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: "20 July 2026",
    description:
      "How Vibespot Technologies Ltd. (Ghana) collects, uses, shares, and retains personal data within RTRS.",
    sections: [
      {
        heading: "1. Who we are",
        body: 'The Restaurant Table Reservation System ("RTRS") is operated by <strong>Vibespot Technologies Ltd.</strong>, a company incorporated in the <strong>Republic of Ghana</strong> ("Data Controller"). Privacy enquiries: <a href="mailto:privacy@vibespot.tech">privacy@vibespot.tech</a>. Each restaurant ("Tenant") using RTRS is itself a controller of its own guests\' and staff\'s personal data under Ghana\'s Data Protection Act, 2012 (Act 843). When you book at a restaurant using RTRS, that restaurant — not Vibespot Technologies Ltd. — is primarily responsible for your data; please also review the restaurant\'s own privacy notice.',
      },
      {
        heading: "2. What data we collect",
        body: "<strong>Tenant & staff:</strong> name, email, username, role, and hashed password; business configuration (name, branding, hours, currency — default Ghana Cedi GHS); and billing records for paid plans. <br><br><strong>Guests/customers:</strong> name, phone (often a Ghana mobile number), email, party size, reservation notes, reservation history, loyalty tags, no-show records, and GHS payment metadata. <br><br><strong>Automatically:</strong> IP address, browser/device data, usage and audit logs, and cookies.",
      },
      {
        heading: "3. Legal framework & lawful basis",
        body: 'Processing is governed by the <strong>Data Protection Act, 2012 (Act 843)</strong> of Ghana, and by the GDPR where we process EU/UK data (see our <a href="/legal/gdpr">GDPR Compliance Statement</a>). We process to provide and secure the Service (contract / legitimate interests), send reservation and waitlist notifications, process GHS subscription payments, comply with Ghanaian tax/accounting and Bank of Ghana record-keeping law, and improve the platform. Where we rely on consent (e.g. optional marketing), you may withdraw it at any time.',
      },
      {
        heading: "4. How we share your data",
        body: "We do <strong>not</strong> sell personal data. We share it only with the relevant restaurant Tenant, with payment processors (Paystack), with infrastructure providers (hosting, MySQL, Redis, SMS/email, analytics) under data-processing agreements, and with authorities where required by Ghanaian law. Transfers outside Ghana use safeguards consistent with the Data Protection Act, 2012.",
      },
      {
        heading: "5. Payments (Ghana)",
        body: "Payments are processed by <strong>Paystack</strong> in <strong>Ghana Cedi (GHS)</strong> via Mobile Money (MTN, Vodafone Cash, AirtelTigo Money), cards, and banks, under PCI-DSS compliance. We store only non-sensitive payment metadata (amount in GHS, status, reference) needed to reconcile reservations, in line with <strong>Bank of Ghana</strong> directives.",
      },
      {
        heading: "6. Data retention",
        body: "Account and configuration data are deleted within 90 days of account closure. Guest reservation data follow each Tenant's retention settings. Audit logs are kept up to 24 months; billing records for the period required by Ghanaian tax and accounting law. On a verified deletion request we delete or anonymise data unless law requires retention.",
      },
      {
        heading: "7. Your rights",
        body: 'Under the Data Protection Act, 2012 (Act 843) you may be informed, access, rectify, erase, restrict, port, and object to processing, and withdraw consent. You may complain to the <strong>Data Protection Commission of Ghana</strong> (<a href="https://dpc.gov.gh" target="_blank" rel="noopener">dpc.gov.gh</a>). Email <a href="mailto:privacy@vibespot.tech">privacy@vibespot.tech</a>; we respond within statutory timeframes.',
      },
      {
        heading: "8. Security",
        body: "We protect data with JWT authentication with rotation, role-based access control, rate limiting, CSRF protection, CSP headers, account lockout, encrypted secrets, and audit logging.",
      },
      {
        heading: "9. Children",
        body: "The Service is not directed to children under 18, and we do not knowingly collect their data without parental consent.",
      },
      {
        heading: "10. Changes",
        body: 'We may update this policy; material changes are announced via the Service or email. The "Last updated" date reflects the latest revision.',
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    lastUpdated: "20 July 2026",
    description:
      "The binding terms governing use of the Restaurant Table Reservation System (Ghana).",
    sections: [
      {
        heading: "1. Acceptance of terms",
        body: "By accessing or using RTRS, operated by <strong>Vibespot Technologies Ltd.</strong> (incorporated in the <strong>Republic of Ghana</strong>), you agree to these Terms. If using on behalf of an organisation, you represent authority to bind it.",
      },
      {
        heading: "2. Description of the Service",
        body: "RTRS is a multi-tenant SaaS platform for reservation, waitlist, floor-plan, scheduling, customer, analytics, and GHS payment features. We may modify or discontinue features with reasonable notice.",
      },
      {
        heading: "3. Accounts and responsibilities",
        body: "You must provide accurate information, safeguard credentials, and notify us of unauthorised use. Tenant Users are responsible for configuring roles, permissions, and retention under Ghana's Data Protection Act, 2012 (Act 843).",
      },
      {
        heading: "4. Acceptable use",
        body: "You may not use the Service unlawfully, infringe rights, upload malicious code, disrupt the Service, scrape or resell it, or process third-party personal data without a lawful basis.",
      },
      {
        heading: "5. Data & privacy",
        body: 'Personal data is governed by our <a href="/legal/privacy">Privacy Policy</a> and, for EU/UK data subjects, our <a href="/legal/gdpr">GDPR Compliance Statement</a>. Each Tenant is an independent controller of its own guests\' and staff\'s data.',
      },
      {
        heading: "6. Customer reservations",
        body: "Reservations are subject to each restaurant's own policies (cancellation, no-show, deposits, dress code). RTRS is a technology provider and not a party to the dining arrangement. Any payment taken is between you and the restaurant.",
      },
      {
        heading: "7. Intellectual property",
        body: "The Service and its software, design, and content are owned by Vibespot Technologies Ltd. or its licensors. These Terms grant a limited, revocable licence to use the Service. Customer-provided data remains the property of the Customer/Tenant.",
      },
      {
        heading: "8. Subscriptions, fees & cancellation (Ghana)",
        body: "Paid plans are billed in <strong>Ghana Cedi (GHS)</strong> on a recurring basis via Paystack. You may cancel any time; cancellation takes effect at period end. Access may be suspended for non-payment after any grace period. Fees are non-refundable except where required by law. Amounts are exclusive of applicable Ghanaian taxes (e.g. VAT) which may be added as required.",
      },
      {
        heading: "9. Service levels & availability",
        body: 'We aim for high availability but provide the Service "as is" and "as available", without warranties of uninterrupted or error-free operation, to the maximum extent permitted by law.',
      },
      {
        heading: "10. Limitation of liability",
        body: "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or loss of data, profits, or business. Aggregate liability is limited to fees paid in the prior three months.",
      },
      {
        heading: "11. Indemnification",
        body: "You agree to indemnify Vibespot Technologies Ltd. from claims arising out of your use, your violation of these Terms, or infringement of third-party rights.",
      },
      {
        heading: "12. Termination",
        body: "We may suspend or terminate access for material breach. On termination, data handling follows our Privacy Policy.",
      },
      {
        heading: "13. Changes",
        body: "We may update these Terms; continued use after changes constitutes acceptance. Material changes are communicated via the Service or email.",
      },
      {
        heading: "14. Governing law",
        body: "These Terms are governed by the laws of the <strong>Republic of Ghana</strong>. Disputes are resolved in the courts of competent jurisdiction in Ghana.",
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    lastUpdated: "20 July 2026",
    description: "How RTRS uses cookies and similar technologies.",
    sections: [
      {
        heading: "1. What cookies are",
        body: "Cookies are small text files placed on your device when you visit RTRS. Similar technologies include local storage, session storage, and pixels.",
      },
      {
        heading: "2. How we use cookies",
        body: "<strong>Strictly necessary (always active):</strong> session/JWT authentication tokens, CSRF tokens, and load-balancing/routing cookies required for the Service to function. <br><br><strong>Functional / preference:</strong> UI preferences (sidebar, theme, language) and tenant context stored in local storage. <br><br><strong>Analytics / performance:</strong> privacy-respecting usage metrics under our legitimate interests. We do <strong>not</strong> use third-party advertising or cross-site tracking cookies.",
      },
      {
        heading: "3. Managing cookies",
        body: "You can control cookies in your browser settings. Blocking strictly necessary cookies may log you out or break core functionality. Preference cookies can be cleared via local storage.",
      },
      {
        heading: "4. Changes",
        body: 'We may update this policy as our use of cookies evolves. The "Last updated" date reflects the latest revision.',
      },
    ],
  },
  gdpr: {
    slug: "gdpr",
    title: "GDPR Compliance Statement",
    lastUpdated: "20 July 2026",
    description:
      "EU/UK GDPR posture, plus our primary Ghana Data Protection Act 2012 (Act 843) framework.",
    sections: [
      {
        heading: "1. Primary framework (Ghana)",
        body: 'Our primary data-protection framework is the <strong>Data Protection Act, 2012 (Act 843)</strong> of Ghana, supervised by the <strong>Data Protection Commission of Ghana</strong>. See our <a href="/legal/privacy">Privacy Policy</a> for Ghana-specific commitments. This statement additionally addresses EU/UK GDPR where we process data relating to individuals in the EEA or UK.',
      },
      {
        heading: "2. Roles",
        body: "<strong>Vibespot Technologies Ltd. — Platform Provider / Joint Controller</strong> for platform data (account, security, billing, operations). <strong>Restaurant Tenants — Independent Controllers</strong> for their guests' and staff's data within their RTRS workspace.",
      },
      {
        heading: "3. Lawful bases",
        body: 'Contract (Art. 6(1)(b)), legitimate interests (Art. 6(1)(f)), legal obligation (Art. 6(1)(c)), and consent where applicable — see our <a href="/legal/privacy">Privacy Policy</a>.',
      },
      {
        heading: "4. Data subject rights",
        body: 'EEA/UK residents have rights to access, rectification, erasure, restriction, portability, objection, and to withdraw consent, plus the right to complain to a supervisory authority. Submit requests to <a href="mailto:privacy@vibespot.tech">privacy@vibespot.tech</a>; we respond within one month. Where a request concerns a Tenant\'s guest data, we coordinate with that Tenant as controller.',
      },
      {
        heading: "5. International transfers",
        body: "Transfers outside the EEA/UK use Standard Contractual Clauses or UK IDTAs, supported by encryption and access controls. Transfers involving Ghana comply with the Data Protection Act, 2012. Sub-processors are bound by written data-processing terms.",
      },
      {
        heading: "6. Sub-processors",
        body: "Categories include cloud hosting, MySQL database and Redis cache/queue services, email/SMS delivery (including Ghana mobile networks), payment processor Paystack, and analytics/error-monitoring. A current list is available on request.",
      },
      {
        heading: "7. Security measures",
        body: "JWT with rotation, RBAC, rate limiting, account lockout, CSRF protection, environment-aware CSP, audit logging, and encrypted secrets.",
      },
      {
        heading: "8. Data breach notification",
        body: "We notify the competent supervisory authority within 72 hours where required, and affected parties without undue delay where there is a high risk to rights and freedoms. Ghana breaches are handled per the Data Protection Act, 2012 and reported to the Data Protection Commission where required.",
      },
      {
        heading: "9. Data protection by design",
        body: "RTRS applies tenant isolation, least-privilege roles, and configurable retention. Tenants should minimise collected data and set appropriate retention periods.",
      },
    ],
  },
  dpa: {
    slug: "dpa",
    title: "Data Processing Agreement",
    lastUpdated: "20 July 2026",
    description:
      "Processor/controller terms between Vibespot Technologies Ltd. (Ghana) and restaurant Tenants.",
    sections: [
      {
        heading: "1. Definitions",
        body: 'Capitalised terms follow the Data Protection Act, 2012 (Act 843) of Ghana and, where relevant, the GDPR. "Personal Data", "Processing", "Data Subject", "Controller", "Processor", and "Sub-processor" have the corresponding meanings.',
      },
      {
        heading: "2. Scope & roles",
        body: "The Controller determines purposes and means for the personal data it enters (guest reservations, customer profiles, staff records). The Processor provides RTRS and Processes that data only on the Controller's documented instructions. For the Controller's own account, billing, and authentication data, the Processor acts as an independent controller.",
      },
      {
        heading: "3. Processor obligations",
        body: "(a) Process only on documented instructions; (b) bind authorised persons to confidentiality; (c) implement appropriate technical and organisational measures; (d) assist with data-subject requests and security/breach obligations; (e) support audits; (f) delete or return data on termination unless law requires retention.",
      },
      {
        heading: "4. Controller obligations",
        body: "(a) Ensure a lawful basis for submitted data and comply with the Data Protection Act, 2012 (Act 843); (b) provide privacy notices and honour rights; (c) issue only lawful instructions.",
      },
      {
        heading: "5. Sub-processing",
        body: "The Controller grants general written authorisation for Sub-processors. The Processor imposes equivalent data-protection obligations and remains liable for their performance.",
      },
      {
        heading: "6. International transfers",
        body: "Transfers outside Ghana use safeguards consistent with the Data Protection Act, 2012; for EEA/UK data, Standard Contractual Clauses or a UK IDTA.",
      },
      {
        heading: "7. Security breach",
        body: "The Processor notifies the Controller without undue delay after becoming aware of a breach affecting the Controller's data, enabling the Controller to meet its own notification duties (including to the Data Protection Commission of Ghana where required).",
      },
    ],
  },
  customer: {
    slug: "customer",
    title: "Customer Policy",
    lastUpdated: "20 July 2026",
    description:
      "Plain-language policy for guests booking or paying through a restaurant on RTRS in Ghana.",
    sections: [
      {
        heading: "1. Making a reservation",
        body: "You provide your name, phone number, and (optionally) email so the restaurant can confirm, remind, and manage your booking. Provide accurate details — wrong details may mean the restaurant cannot reach you. A reservation is confirmed only when the restaurant (or the system on its behalf) marks it confirmed. <em>Your booking is with the restaurant, not Vibespot Technologies Ltd.</em>",
      },
      {
        heading: "2. Deposits & payments",
        body: "Some restaurants require a <strong>deposit</strong> or <strong>pre-payment</strong> to secure your table (large groups or peak times). Payments are in <strong>Ghana Cedi (GHS)</strong> via <strong>Paystack</strong> (Mobile Money — MTN, Vodafone Cash, AirtelTigo Money — cards, banks). Your financial details are handled directly by Paystack; the restaurant and RTRS never see your full details. The amount and refundability are shown before you pay.",
      },
      {
        heading: "3. Cancellations & no-shows",
        body: 'Cancel as early as possible via the link/message you received or by calling the restaurant. Restaurants may apply a <strong>no-show policy</strong> that can include forfeiting a deposit; no-show history may be recorded on your profile at that restaurant. Refunds follow the restaurant\'s policy and the <a href="/legal/payment-refund">Payment &amp; Refund Policy</a>, returned via the original Paystack method.',
      },
      {
        heading: "4. Your data & privacy",
        body: 'The restaurant is the controller of your booking data. Vibespot Technologies Ltd. processes it as platform provider under the <a href="/legal/privacy">Privacy Policy</a> and Ghana\'s Data Protection Act, 2012 (Act 843). Request access, correction, or deletion from the restaurant, or contact <a href="mailto:privacy@vibespot.tech">privacy@vibespot.tech</a>. Service messages (confirmations, reminders, waitlist) are transactional.',
      },
      {
        heading: "5. Communications & consent",
        body: "By providing your phone/email you agree to booking-related messages; standard mobile-network charges may apply. Optional marketing is sent only with separate consent, withdrawable anytime.",
      },
      {
        heading: "6. Liability",
        body: "RTRS is booking technology; we are not responsible for the food, service, premises, or conduct of the restaurant. The restaurant is responsible for honouring your confirmed reservation.",
      },
      {
        heading: "7. Complaints",
        body: 'For booking/meal issues, contact the restaurant. For data concerns, contact <a href="mailto:privacy@vibespot.tech">privacy@vibespot.tech</a> or the <strong>Data Protection Commission of Ghana</strong> (<a href="https://dpc.gov.gh" target="_blank" rel="noopener">dpc.gov.gh</a>).',
      },
    ],
  },
  tenant: {
    slug: "tenant",
    title: "Tenant (Merchant) Policy",
    lastUpdated: "20 July 2026",
    description:
      "Terms for restaurants using RTRS in Ghana — data-controller duties, payments, and compliance.",
    sections: [
      {
        heading: "1. Your role as a data controller",
        body: 'When you process personal data of guests and staff through RTRS, <strong>you are an independent data controller</strong> under Ghana\'s Data Protection Act, 2012 (Act 843). You must have a lawful basis, give guests a privacy notice (reference our <a href="/legal/customer">Customer Policy</a> and <a href="/legal/privacy">Privacy Policy</a>), honour data-subject rights, and set retention periods. Vibespot Technologies Ltd. acts as your processor and will assist you.',
      },
      {
        heading: "2. Account setup & users",
        body: "Provide accurate business details (including GRA VAT/registration where relevant). You are responsible for the roles, permissions, and staff accounts you create; onboard only authorised staff and remove access when they leave. You are liable for all activity under your Tenant account.",
      },
      {
        heading: "3. Taking payments (Ghana)",
        body: 'RTRS supports GHS payments through <strong>Paystack</strong> (Mobile Money, cards, banks). Connect your own Paystack keys and a valid Ghanaian payout bank account. You set prices, deposits, taxes (incl. VAT), and refund rules. Settlement/payouts are handled by Paystack. Comply with <strong>Bank of Ghana</strong> e-money/payment directives and GRA tax obligations. See the <a href="/legal/payment-refund">Payment &amp; Refund Policy</a>.',
      },
      {
        heading: "4. Customer communications",
        body: "Booking confirmations, reminders, and waitlist messages are transactional. Marketing requires consent and must honour opt-outs, complying with Ghana's Electronic Communications Act, 2008 (Act 775) and the Data Protection Act, 2012. You are responsible for message content.",
      },
      {
        heading: "5. Fees & subscription",
        body: "Plan fees are billed in GHS via Paystack on a recurring basis; taxes (e.g. VAT) may be added as required. Non-payment may lead to suspension after a grace period. Export your data before closure if needed.",
      },
      {
        heading: "6. Acceptable use",
        body: "Do not use RTRS unlawfully, process data without a lawful basis, spam customers, or circumvent tenant isolation. We may suspend accounts violating Ghanaian law or these terms.",
      },
    ],
  },
  "payment-refund": {
    slug: "payment-refund",
    title: "Payment & Refund Policy",
    lastUpdated: "20 July 2026",
    description:
      "How GHS payments and refunds work on RTRS via Paystack (Mobile Money, cards, banks).",
    sections: [
      {
        heading: "1. Payment method",
        body: "All RTRS payments are in <strong>Ghana Cedi (GHS)</strong> through <strong>Paystack</strong>: <strong>Mobile Money</strong> (MTN MoMo, Vodafone Cash, AirtelTigo Money), <strong>cards</strong> (Visa/Mastercard), and <strong>bank</strong> options. Your financial details are processed directly by Paystack (PCI-DSS); RTRS and the restaurant do not store your card or Mobile Money PIN.",
      },
      {
        heading: "2. Who you pay",
        body: "A deposit or pre-payment pays the <strong>restaurant</strong> (the Merchant), not Vibespot Technologies Ltd. The restaurant sets the amount, currency, and refundability. RTRS records only payment metadata (amount in GHS, status, Paystack reference).",
      },
      {
        heading: "3. Deposits & pre-payments",
        body: "Deposits may secure a table for large parties, peak hours, or events. Refundability is shown at checkout and set by the restaurant. Completing payment confirms the amount and terms displayed before you authorise the Paystack charge.",
      },
      {
        heading: "4. Refunds",
        body: "<strong>Eligibility:</strong> governed by the restaurant's cancellation/refund rules shown at booking. <br><strong>Method:</strong> returned to the <strong>original payment method</strong> via Paystack (e.g. back to your Mobile Money wallet or card). <br><strong>Timing:</strong> Mobile Money and card refunds typically settle within <strong>1–5 business days</strong>, subject to Paystack and your network/bank. <br><strong>No-shows:</strong> deposits may be forfeited under the restaurant's no-show policy.",
      },
      {
        heading: "5. Failed & disputed transactions",
        body: 'Failed payments deduct nothing (or reverse any temporary hold). For unauthorised/disputed charges, contact the restaurant first, then <strong>Paystack support</strong> and your mobile operator/bank. Keep your Paystack transaction reference. Email <a href="mailto:legal@vibespot.tech">legal@vibespot.tech</a> for assistance.',
      },
      {
        heading: "6. Taxes & fees",
        body: "Prices are set by the restaurant and may be inclusive or exclusive of <strong>VAT</strong> per GRA rules. RTRS subscription fees are billed separately in GHS and may include applicable taxes. Paystack transaction fees are borne by the Merchant unless passed on as shown at checkout.",
      },
      {
        heading: "7. Regulatory compliance",
        body: "Payment processing complies with applicable <strong>Bank of Ghana</strong> directives on electronic money and payment services, AML obligations, and GRA tax requirements. RTRS keeps audit logs of payment events for reconciliation and compliance.",
      },
    ],
  },
  accessibility: {
    slug: "accessibility",
    title: "Accessibility Statement",
    lastUpdated: "20 July 2026",
    description:
      "Our WCAG 2.1 AA commitment, tuned for Ghana's networks and devices.",
    sections: [
      {
        heading: "1. Conformance target",
        body: "We aim to meet <strong>WCAG 2.1 Level AA</strong>. The frontend uses Vue 3, PrimeVue, and Vuestic UI with a centralised, high-contrast brand design system (accessible contrast, typography, and focus states).",
      },
      {
        heading: "2. Measures we take",
        body: "Semantic HTML and ARIA labels, keyboard-operable navigation with a collapsible sidebar and visible focus, sufficient colour contrast, labelled form inputs with errors, and a responsive layout usable on mobile, tablet, and desktop — including lower-bandwidth mobile networks common in Ghana.",
      },
      {
        heading: "3. Known limitations",
        body: "Some legacy and dynamically generated components may not yet fully meet Level AA in every state. We are actively remediating these.",
      },
      {
        heading: "4. Feedback & contact",
        body: 'Report barriers or request alternative formats at <a href="mailto:accessibility@vibespot.tech">accessibility@vibespot.tech</a>. We respond within 5 business days.',
      },
      {
        heading: "5. Enforcement",
        body: "If unsatisfied, you may contact the National Council on Persons with Disability (Ghana) or the relevant accessibility authority in your jurisdiction.",
      },
    ],
  },
};

export const legalDocumentSlugs = Object.keys(legalDocuments);

const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

const LEGAL_DIR = path.join(__dirname, "..", "..", "..", "legal");

const SLUG_TO_FILE = {
  privacy: "PRIVACY_POLICY.md",
  terms: "TERMS_OF_SERVICE.md",
  cookies: "COOKIE_POLICY.md",
  gdpr: "GDPR_COMPLIANCE.md",
  dpa: "DATA_PROCESSING_AGREEMENT.md",
  customer: "CUSTOMER_POLICY.md",
  tenant: "TENANT_POLICY.md",
  "payment-refund": "PAYMENT_REFUND_POLICY.md",
  accessibility: "ACCESSIBILITY_STATEMENT.md",
};

const TITLE_OVERRIDES = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  cookies: "Cookie Policy",
  gdpr: "GDPR Compliance Statement",
  dpa: "Data Processing Agreement",
  customer: "Customer Policy",
  tenant: "Tenant (Merchant) Policy",
  "payment-refund": "Payment & Refund Policy",
  accessibility: "Accessibility Statement",
};

function splitSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch && /^#/.test(line) && !line.startsWith("###")) {
      const text = headingMatch[1].trim();
      if (!current) {
        current = { heading: text, body: "" };
        sections.push(current);
      } else {
        current = { heading: text, body: "" };
        sections.push(current);
      }
      continue;
    }
    if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }

  return sections.map((s) => ({
    heading: s.heading,
    body: s.body.trim().replace(/\n{2,}/g, "\n\n"),
  }));
}

function readLegalDoc(slug) {
  const file = SLUG_TO_FILE[slug];
  if (!file) return null;
  const fullPath = path.join(LEGAL_DIR, file);
  if (!fs.existsSync(fullPath)) return null;

  const markdown = fs.readFileSync(fullPath, "utf-8");
  const updatedMatch = markdown.match(
    /Last updated:?\s*\**\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\**/i
  );
  const firstHeading = markdown.match(/^#\s+(.*)$/m);

  return {
    slug,
    title: TITLE_OVERRIDES[slug] || (firstHeading ? firstHeading[1].trim() : slug),
    lastUpdated: updatedMatch ? updatedMatch[1] : null,
    markdown,
    sections: splitSections(markdown),
  };
}

const listHandler = (req, res) => {
  const docs = Object.keys(SLUG_TO_FILE).map((slug) => ({
    slug,
    title: TITLE_OVERRIDES[slug] || slug,
  }));
  return res.status(200).json({ success: true, documents: docs });
};

const getHandler = (req, res) => {
  const { slug } = req.params;
  const doc = readLegalDoc(slug);
  if (!doc) {
    return res
      .status(404)
      .json({ success: false, message: "Legal document not found" });
  }
  return res.status(200).json({ success: true, document: doc });
};

const SUBPROCESSORS = [
  {
    name: "Paystack",
    category: "payments",
    purpose: "Payment processing (Mobile Money, cards, banks) for Ghana Cedi transactions",
    location: "Nigeria / Ghana",
    dataTypes: ["payment details", "billing address", "transaction metadata"],
    contract: "https://paystack.com/docs/legal/dpa",
    safeguards: ["TLS 1.2+", "PCI-DSS compliant", "encrypted API keys"],
  },
  {
    name: "ShaQ Express",
    category: "logistics",
    purpose: "Delivery routing, tracking, and dispatch for restaurant orders",
    location: "Ghana",
    dataTypes: ["delivery addresses", "recipient phone", "order details"],
    contract: "https://shaqexpress.com/legal/dpa",
    safeguards: ["encrypted transit", "access logging", "data retention limits"],
  },
  {
    name: "AWS",
    category: "infrastructure",
    purpose: "Cloud hosting, object storage, and compute for application infrastructure",
    location: "Ireland / South Africa (AWS Africa regions)",
    dataTypes: ["IP addresses", "request logs", "infrastructure metrics"],
    contract: "https://aws.amazon.com/compliance/gdpr/",
    safeguards: ["encryption at rest", "IAM access controls", "VPC isolation"],
  },
  {
    name: "Redis Labs",
    category: "infrastructure",
    purpose: "Job queue (BullMQ) and caching layer for real-time operations",
    location: "USA / EU",
    dataTypes: ["session tokens", "queue metadata", "cache keys"],
    contract: "https://redis.io/legal/dpa",
    safeguards: ["TLS in transit", "encrypted persistence", "RBAC"],
  },
  {
    name: "Sentry",
    category: "observability",
    purpose: "Error tracking and performance monitoring",
    location: "USA / EU",
    dataTypes: ["error traces", "stack traces", "breadcrumbs", "IP addresses"],
    contract: "https://sentry.io/legal/dpa/",
    safeguards: ["data scrubbing", "PII masking", "retention policies"],
  },
  {
    name: "Vercel",
    category: "infrastructure",
    purpose: "Frontend deployment and edge network for customer-facing UI",
    location: "USA / EU / Asia-Pacific",
    dataTypes: ["HTTP logs", "edge IPs", "build artifacts"],
    contract: "https://vercel.com/legal/dpa",
    safeguards: ["edge encryption", "SOC 2 Type II", "access logs"],
  },
];

const subprocessorsHandler = (req, res) => {
  return res.status(200).json({
    success: true,
    lastUpdated: "2026-07-21",
    subprocessors: SUBPROCESSORS,
  });
};

router.route("/").get(listHandler).all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));
router.route("/subprocessors").get(subprocessorsHandler).all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));
router.route("/:slug").get(getHandler).all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;

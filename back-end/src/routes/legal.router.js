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

router.route("/").get(listHandler).all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));
router.route("/:slug").get(getHandler).all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;

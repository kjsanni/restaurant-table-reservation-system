const legalAcceptanceDAO = require("../DAOs/legalAcceptance.dao");

// Known legal document slugs and their current versions. Bump the version in
// this map whenever a document's content changes so acceptances are re-required.
const LEGAL_DOCUMENT_VERSIONS = {
  tenant: "2026-07-20",
  dpa: "2026-07-20",
  privacy: "2026-07-20",
  terms: "2026-07-20",
  "payment-refund": "2026-07-20",
  customer: "2026-07-20",
  cookies: "2026-07-20",
  gdpr: "2026-07-20",
  accessibility: "2026-07-20",
};

const getAcceptancesHandler = async (req, res) => {
  const records = await legalAcceptanceDAO.listByTenant(req.params.tenantId);
  res.status(200).json({
    success: true,
    items: records.map((r) => ({
      slug: r.slug,
      version: r.version,
      acceptedAt: r.createdAt,
      acceptedBy: r.userId,
      ipAddress: r.ipAddress,
    })),
  });
};

const acceptHandler = async (req, res) => {
  const { slug } = req.body;
  if (!slug || !LEGAL_DOCUMENT_VERSIONS[slug]) {
    return res
      .status(400)
      .json({ success: false, message: "Unknown or missing legal document slug" });
  }

  const version = LEGAL_DOCUMENT_VERSIONS[slug];
  const record = await legalAcceptanceDAO.record({
    tenantId: req.params.tenantId,
    userId: req.user ? req.user.id : null,
    slug,
    version,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  });

  res.status(201).json({
    success: true,
    item: {
      slug: record.slug,
      version: record.version,
      acceptedAt: record.createdAt,
      acceptedBy: record.userId,
      ipAddress: record.ipAddress,
    },
  });
};

module.exports = {
  LEGAL_DOCUMENT_VERSIONS,
  getAcceptancesHandler,
  acceptHandler,
};

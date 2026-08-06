const fs = require("fs");
const path = require("path");
const db = require("../db/models");
const planDAO = require("../tenant-platform/DAOs/plan.dao");

const listPublicPlansHandler = async (req, res) => {
  const plans = await planDAO.findAll({ isActive: true });
  const sanitized = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    currency: plan.currency,
    maxTables: plan.maxTables,
    maxReservationsPerMonth: plan.maxReservationsPerMonth,
    sortOrder: plan.sortOrder,
  }));
  return res.status(200).json({ success: true, plans: sanitized });
};

const getChangelogHandler = async (req, res) => {
  const changelogPath = path.join(process.cwd(), "..", "CHANGELOG.md");
  try {
    const content = fs.readFileSync(changelogPath, "utf8"); // nosep - changelogPath is built from process.cwd() and a static relative path, not user input
    return res.status(200).json({ success: true, content });
  } catch (err) {
    return res
      .status(err.code === "ENOENT" ? 404 : 500)
      .json({ success: false, message: "Changelog not available." });
  }
};

module.exports = {
  listPublicPlansHandler,
  getChangelogHandler,
};

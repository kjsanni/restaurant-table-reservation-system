const db = require("../../db/models");

const getBrandingHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id, {
    attributes: ["logoUrl", "primaryColor", "customDomain", "domain"],
  });
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  res.status(200).json({ success: true, item: tenant });
};

const updateBrandingHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.id);
  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }
  const allowed = ["logoUrl", "primaryColor", "customDomain"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  await tenant.update(updates);
  res.status(200).json({ success: true, item: tenant });
};

module.exports = {
  getBrandingHandler,
  updateBrandingHandler,
};

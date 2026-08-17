const response = require("../utils/response");

const db = require("../../db/models");

const syncBrandingToSettings = async (tenantId, updates) => {
  try {
    const brandingSetting = await db.setting.findOne({
      where: { tenantId, key: "branding" },
    });

    if (!brandingSetting) return;

    const branding = brandingSetting.value && typeof brandingSetting.value === "string"
      ? JSON.parse(brandingSetting.value)
      : brandingSetting.value || {};

    const map = {
      logoUrl: "logoUrl",
      primaryColor: "primaryColor",
      secondaryColor: "secondaryColor",
      customDomain: "customDomain",
      brandName: "brandName",
    };

    Object.entries(updates).forEach(([key, value]) => {
      const settingKey = map[key];
      if (settingKey && value !== undefined && value !== null && value !== "") {
        branding[settingKey] = value;
      }
    });

    await brandingSetting.update({ value: branding });
  } catch (err) {
    console.error("Failed to sync branding to settings:", err.message);
  }
};

const getBrandingHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId, {
    attributes: ["logoUrl", "primaryColor", "secondaryColor", "customDomain", "domain"],
  });
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  res.status(200).json({ success: true, item: tenant });
};

const updateBrandingHandler = async (req, res) => {
  const tenant = await db.tenant.findByPk(req.params.tenantId);
  if (!tenant) {
    return response.notFound(res, "Tenant not found");
  }
  const allowed = ["logoUrl", "primaryColor", "secondaryColor", "customDomain"];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updates[key] = req.body[key];
    }
  }
  await tenant.update(updates);
  await syncBrandingToSettings(tenant.id, updates);
  res.status(200).json({ success: true, item: tenant });
};

module.exports = {
  getBrandingHandler,
  updateBrandingHandler,
};

const db = require("../../db/models");

const getBySlugHandler = async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(400).json({ success: false, message: "Slug is required" });
  }

  const tenant = await db.tenant.findOne({
    where: { slug },
    attributes: [
      "id",
      "name",
      "slug",
      "domain",
      "status",
      "plan",
      "currency",
      "businessVertical",
      "restaurantType",
      "serviceModes",
      "createdAt",
      "updatedAt",
    ],
  });

  if (!tenant) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const json = tenant.toJSON();

  if (json.settings && typeof json.settings === "object") {
    json.settings = {
      branding: json.settings.branding || null,
    };
  } else {
    json.settings = null;
  }

  res.status(200).json({ success: true, item: json });
};

module.exports = { getBySlugHandler };

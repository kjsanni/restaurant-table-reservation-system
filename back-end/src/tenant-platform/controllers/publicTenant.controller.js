const response = require("../utils/response");

const db = require("../../db/models");

const getBySlugHandler = async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return response.badRequest(res, "Slug is required");
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
    return response.notFound(res, "Tenant not found");
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

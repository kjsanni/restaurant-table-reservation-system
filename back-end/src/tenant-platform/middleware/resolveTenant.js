const db = require("../../db/models");

const resolveTenant = async (req, res, next) => {
  if (!process.env.TENANT_MODE || process.env.TENANT_MODE !== "enabled") {
    return next();
  }

  let tenantIdentifier = null;

  if (req.headers["x-tenant-id"]) {
    tenantIdentifier = req.headers["x-tenant-id"];
  } else if (req.headers["x-tenant-slug"]) {
    tenantIdentifier = { slug: req.headers["x-tenant-slug"] };
  } else if (req.hostname && req.hostname !== "localhost" && req.hostname !== "127.0.0.1") {
    const hostname = req.hostname.toLowerCase();
    const subdomain = hostname.split(".")[0];
    if (subdomain && subdomain !== "www") {
      tenantIdentifier = { slug: subdomain };
    }
  }

  if (!tenantIdentifier) {
    return res.status(400).json({
      success: false,
      message: "Tenant identifier not provided. Use X-Tenant-Id or X-Tenant-Slug header.",
    });
  }

  let where = {};
  if (typeof tenantIdentifier === "string") {
    const id = parseInt(tenantIdentifier, 10);
    where = Number.isNaN(id) ? { slug: tenantIdentifier } : { id };
  } else {
    where = tenantIdentifier;
  }

  try {
    const tenant = await db.tenant.findOne({ where });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found.",
      });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    console.error("Tenant resolution error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve tenant.",
    });
  }
};

module.exports = { resolveTenant };

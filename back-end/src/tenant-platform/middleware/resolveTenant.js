const { isTenantModeEnabled } = require("../utils/tenantMode");
const db = require("../../db/models");
const { cache } = require("../../utils/cache");

const TENANT_CACHE_TTL = 300;
const TENANT_NEGATIVE_CACHE_TTL = 30;

const resolveTenant = async (req, res, next) => {
  if (!(await isTenantModeEnabled())) {
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
  let cacheKey = null;
  if (typeof tenantIdentifier === "string") {
    const id = parseInt(tenantIdentifier, 10);
    if (Number.isNaN(id)) {
      where = { slug: tenantIdentifier };
      cacheKey = `tenant:slug:${tenantIdentifier}`;
    } else {
      where = { id };
      cacheKey = `tenant:id:${id}`;
    }
  } else {
    where = tenantIdentifier;
    cacheKey = `tenant:slug:${tenantIdentifier.slug}`;
  }

  try {
    let tenant = null;
    if (cacheKey) {
      const cached = await cache.get(cacheKey);
      if (cached === "__NOT_FOUND__") {
        return res.status(404).json({
          success: false,
          message: "Tenant not found.",
        });
      }
      if (cached) {
        tenant = db.tenant.build(cached);
      }
    }

    if (!tenant) {
      tenant = await db.tenant.findOne({ where });

      if (!tenant) {
        if (cacheKey) {
          await cache.set(cacheKey, "__NOT_FOUND__", TENANT_NEGATIVE_CACHE_TTL);
        }
        return res.status(404).json({
          success: false,
          message: "Tenant not found.",
        });
      }

      if (cacheKey) {
        await cache.set(cacheKey, tenant.toJSON(), TENANT_CACHE_TTL);
      }
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

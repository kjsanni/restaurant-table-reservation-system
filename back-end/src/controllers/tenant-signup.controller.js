const db = require("../db/models");
const authService = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const tenantAdminDAO = require("../tenant-platform/DAOs/tenantAdmin.dao");
const planDAO = require("../tenant-platform/DAOs/plan.dao");
const { applyTypeDefaults } = require("../tenant-platform/services/tenantTypeDefaults.service");

const signupTenantHandler = async (req, res) => {
  const {
    name,
    slug,
    email,
    password,
    businessVertical,
    restaurantType,
    serviceModes,
    planSlug,
  } = req.body;

  if (!name || !slug || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, slug, email, and password are required",
    });
  }

  const normalizedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!normalizedSlug) {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }

  const existingTenant = await tenantAdminDAO.findBySlug(normalizedSlug);
  if (existingTenant) {
    return res.status(409).json({ success: false, message: "Business slug is already taken" });
  }

  const existingUser = await authDAO.findUserByEmail(email, null);
  if (existingUser) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  let plan = null;
  if (planSlug) {
    plan = await planDAO.findBySlug(planSlug);
    if (!plan) {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }
  }

  const dbSeq = db.sequelize;
  const result = await dbSeq.transaction(async (t) => {
    const tenant = await tenantAdminDAO.create({
      name,
      slug: normalizedSlug,
      plan: plan?.slug || "starter",
      status: "trialing",
      currency: "GHS",
      businessVertical: businessVertical || "restaurant",
      restaurantType: restaurantType || "full_service",
      serviceModes: serviceModes || ["dine_in", "takeaway", "delivery"],
      settings: {},
    }, { transaction: t });

    if (tenant.businessVertical === "salon") {
      applyTypeDefaults(tenant, "salon");
    } else if (restaurantType) {
      applyTypeDefaults(tenant, restaurantType);
    }
    await tenant.save({ transaction: t });

    const username = email.split("@")[0];
    const user = await authService.registerUser(authDAO, {
      username,
      email,
      password,
    }, tenant.id, "admin", { transaction: t });

    const token = authService.generateToken(user.id, user.role);
    const refreshToken = authService.generateRefreshToken();

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await authDAO.createRefreshToken(user.id, refreshToken, expiresAt, tenant.id, { transaction: t });

    return { tenant, user, token, refreshToken };
  });

  const { tenant, user, token, refreshToken } = result;

  const isSecure = req.secure || false;
  const cookieBase = {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "lax" : false,
    path: "/",
  };

  res.cookie("token", token, { ...cookieBase, maxAge: 30 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });

  return res.status(201).json({
    success: true,
    message: "Tenant created successfully!",
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      businessVertical: tenant.businessVertical,
      restaurantType: tenant.restaurantType,
      serviceModes: tenant.serviceModes,
    },
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = {
  signupTenantHandler,
};

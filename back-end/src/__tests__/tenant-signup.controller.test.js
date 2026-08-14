const tenantSignupController = require("../controllers/tenant-signup.controller");

jest.mock("../services/authService", () => ({
  registerUser: jest.fn(),
  generateToken: jest.fn((userId, role) => `token-${userId}`),
  generateRefreshToken: jest.fn(() => "refresh-token"),
}));

jest.mock("../DAOs/auth.dao", () => ({
  findUserByEmail: jest.fn(),
  createRefreshToken: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/tenantAdmin.dao", () => ({
  findBySlug: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../tenant-platform/DAOs/plan.dao", () => ({
  findBySlug: jest.fn(),
}));

jest.mock("../tenant-platform/controllers/verticalTemplate.controller", () => ({
  getTemplateById: jest.fn(),
  recordTemplateUsage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../tenant-platform/services/tenantTypeDefaults.service", () => ({
  applyTypeDefaults: jest.fn(),
  seedEventSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../tenant-platform/services/provisioning.service", () => ({
  startProvisioning: jest.fn().mockResolvedValue({ status: "completed" }),
}));

jest.mock("../db/models", () => ({
  sequelize: {
    transaction: jest.fn(async (fn) => fn()),
  },
}));

const authService = require("../services/authService");
const authDAO = require("../DAOs/auth.dao");
const tenantAdminDAO = require("../tenant-platform/DAOs/tenantAdmin.dao");
const planDAO = require("../tenant-platform/DAOs/plan.dao");
const db = require("../db/models");
const { createRes } = require("./utils/test-response");

function createReq(body = {}) {
  return {
    body,
    secure: false,
    ip: "127.0.0.1",
    connection: { remoteAddress: "127.0.0.1" },
    socket: { remoteAddress: "127.0.0.1" },
  };
}

describe("tenant-signup.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.generateToken.mockImplementation((userId, role) => `token-${userId}`);
    authService.generateRefreshToken.mockReturnValue("refresh-token");
    db.sequelize.transaction.mockImplementation(async (fn) => fn());
  });

  it("returns 400 when required fields are missing", async () => {
    const req = createReq({});
    const res = createRes();
    await tenantSignupController.signupTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Name, slug, email, and password are required",
    });
  });

  it("returns 409 when slug is taken", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue({ id: 1, slug: "existing" });
    const req = createReq({
      name: "Test Business",
      slug: "existing",
      email: "test@test.com",
      password: "Password123",
    });
    const res = createRes();
    await tenantSignupController.signupTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Business slug is already taken",
    });
  });

  it("returns 409 when email already exists", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue(null);
    authDAO.findUserByEmail.mockResolvedValue({ id: 1, email: "test@test.com" });
    const req = createReq({
      name: "Test Business",
      slug: "new-business",
      email: "test@test.com",
      password: "Password123",
    });
    const res = createRes();
    await tenantSignupController.signupTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An account with this email already exists",
    });
  });

  it("creates tenant and admin user on success", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue(null);
    authDAO.findUserByEmail.mockResolvedValue(null);
    planDAO.findBySlug.mockResolvedValue({ id: 1, slug: "starter", name: "Starter" });

    const mockTenant = {
      id: 10,
      name: "Test Business",
      slug: "test-business",
      plan: "starter",
      businessVertical: "restaurant",
      restaurantType: "full_service",
      serviceModes: ["dine_in", "takeaway", "delivery"],
      save: jest.fn().mockResolvedValue(true),
    };
    tenantAdminDAO.create.mockResolvedValue(mockTenant);

    authService.registerUser.mockResolvedValue({
      id: 20,
      username: "test",
      email: "test@test.com",
      role: "admin",
      permissions: {},
    });

    const req = createReq({
      name: "Test Business",
      slug: "test-business",
      email: "test@test.com",
      password: "Password123",
      businessVertical: "restaurant",
      restaurantType: "full_service",
      serviceModes: ["dine_in", "takeaway", "delivery"],
      planSlug: "starter",
    });
    const res = createRes();

    await tenantSignupController.signupTenantHandler(req, res);

    expect(tenantAdminDAO.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Business",
        slug: "test-business",
        plan: "starter",
        status: "trialing",
      }),
      expect.any(Object)
    );
    expect(authService.registerUser).toHaveBeenCalledWith(
      authDAO,
      expect.objectContaining({
        email: "test@test.com",
        password: "Password123",
      }),
      10,
      "admin",
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.cookie).toHaveBeenCalledWith("token", "token-20", expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token", expect.any(Object));
  });

  it("returns 400 when plan slug is invalid", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue(null);
    authDAO.findUserByEmail.mockResolvedValue(null);
    planDAO.findBySlug.mockResolvedValue(null);

    const req = createReq({
      name: "Test Business",
      slug: "test-business",
      email: "test@test.com",
      password: "Password123",
      planSlug: "nonexistent",
    });
    const res = createRes();

    await tenantSignupController.signupTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid plan selected",
    });
  });

  it("applies event template settings when templateId is provided", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue(null);
    authDAO.findUserByEmail.mockResolvedValue(null);
    planDAO.findBySlug.mockResolvedValue({ id: 1, slug: "starter", name: "Starter" });
    const verticalTemplateController = require("../tenant-platform/controllers/verticalTemplate.controller");
    verticalTemplateController.getTemplateById.mockResolvedValue({
      id: 14,
      name: "VIP Lounge",
      vertical: "event",
      defaultSettings: { restaurantType: "vip_lounge", businessVertical: "event" },
      defaultServiceModes: ["vip_access", "table_reservation", "event_checkin"],
      featureFlags: { event_vip_lounge: true, event_guest_list: true },
    });

    const mockTenant = {
      id: 11,
      name: "Event Business",
      slug: "event-business",
      plan: "starter",
      businessVertical: "event",
      restaurantType: "vip_lounge",
      serviceModes: ["vip_access", "table_reservation", "event_checkin"],
      settings: { featureFlags: { event_vip_lounge: true, event_guest_list: true } },
      save: jest.fn().mockResolvedValue(true),
    };
    tenantAdminDAO.create.mockResolvedValue(mockTenant);

    authService.registerUser.mockResolvedValue({
      id: 21,
      username: "event",
      email: "event@test.com",
      role: "admin",
      permissions: {},
    });

    const req = createReq({
      name: "Event Business",
      slug: "event-business",
      email: "event@test.com",
      password: "Password123",
      templateId: 14,
    });
    const res = createRes();

    await tenantSignupController.signupTenantHandler(req, res);

    expect(tenantAdminDAO.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessVertical: "event",
        restaurantType: "vip_lounge",
        serviceModes: ["vip_access", "table_reservation", "event_checkin"],
        templateId: 14,
      }),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 400 when templateId is invalid", async () => {
    tenantAdminDAO.findBySlug.mockResolvedValue(null);
    authDAO.findUserByEmail.mockResolvedValue(null);
    const verticalTemplateController = require("../tenant-platform/controllers/verticalTemplate.controller");
    verticalTemplateController.getTemplateById.mockResolvedValue(null);

    const req = createReq({
      name: "Test Business",
      slug: "test-business",
      email: "test@test.com",
      password: "Password123",
      templateId: 999,
    });
    const res = createRes();

    await tenantSignupController.signupTenantHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Template with id 999 not found",
    });
  });
});

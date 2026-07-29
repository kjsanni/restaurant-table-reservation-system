jest.mock("../tenant-platform/utils/tenantMode");

describe("resolveTenant middleware", () => {
  let req;
  let res;
  let next;
  let db;
  let resolveTenant;
  let isTenantModeEnabled;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    jest.doMock("../utils/cache", () => {
      const mockCache = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
      };
      return {
        cache: mockCache,
        client: null,
        isConnected: false,
        getCacheStats: jest.fn(() => ({ hits: 0, misses: 0, gets: 0 })),
        resetCacheStats: jest.fn(),
        closeClient: jest.fn(),
      };
    });

    const tenantMode = require("../tenant-platform/utils/tenantMode");
    isTenantModeEnabled = tenantMode.isTenantModeEnabled;
    isTenantModeEnabled.mockResolvedValue(true);

    req = {
      headers: {},
      hostname: "localhost",
      path: "/api/v1/reservations",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    db = require("../db/models");
    db.tenant = {
      findOne: jest.fn(),
      build: jest.fn((attrs) => ({ ...attrs, toJSON: () => attrs })),
    };
    db.tenant.findOne.mockResolvedValue(null);

    const { resolveTenant: rt } = require("../tenant-platform/middleware/resolveTenant");
    resolveTenant = rt;
  });

  it("sets req.tenant from x-tenant-id header when tenant exists", async () => {
    const tenant = { id: 1, name: "Accra", slug: "accra", toJSON: () => ({ id: 1, name: "Accra", slug: "accra" }) };
    db.tenant.findOne.mockResolvedValue(tenant);
    req.headers["x-tenant-id"] = "1";

    await resolveTenant(req, res, next);

    expect(req.tenant).toBe(tenant);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("sets req.tenant from x-tenant-slug header", async () => {
    const tenant = { id: 2, name: "Kumasi", slug: "kumasi", toJSON: () => ({ id: 2, name: "Kumasi", slug: "kumasi" }) };
    db.tenant.findOne.mockResolvedValue(tenant);
    req.headers["x-tenant-slug"] = "kumasi";

    await resolveTenant(req, res, next);

    expect(req.tenant).toBe(tenant);
    expect(db.tenant.findOne).toHaveBeenCalledWith({ where: { slug: "kumasi" } });
  });

  it("extracts subdomain slug from hostname when no header is present", async () => {
    const tenant = { id: 3, name: "Labone", slug: "labone", toJSON: () => ({ id: 3, name: "Labone", slug: "labone" }) };
    db.tenant.findOne.mockResolvedValue(tenant);
    req.hostname = "labone.saas.com";

    await resolveTenant(req, res, next);

    expect(req.tenant).toBe(tenant);
    expect(db.tenant.findOne).toHaveBeenCalledWith({ where: { slug: "labone" } });
  });

  it("returns 400 when no tenant identifier is provided", async () => {
    req.headers = {};
    req.hostname = "localhost";

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Tenant identifier not provided. Use X-Tenant-Id or X-Tenant-Slug header.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when tenant ID does not exist", async () => {
    req.headers["x-tenant-id"] = "9999";
    db.tenant.findOne.mockResolvedValue(null);

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Tenant not found.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when tenant slug does not exist", async () => {
    req.headers["x-tenant-slug"] = "unknown-slug";
    db.tenant.findOne.mockResolvedValue(null);

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it("skips resolution when tenant mode is disabled", async () => {
    isTenantModeEnabled.mockResolvedValue(false);

    await resolveTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(db.tenant.findOne).not.toHaveBeenCalled();
  });

  it("skips resolution for platform admin paths", async () => {
    req.path = "/api/v1/admin/tenants";
    req.headers = {};

    await resolveTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(db.tenant.findOne).not.toHaveBeenCalled();
  });

  it("skips resolution for public health path", async () => {
    req.path = "/api/v1/health";
    req.headers = {};

    await resolveTenant(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(db.tenant.findOne).not.toHaveBeenCalled();
  });

  it("returns 500 when tenant resolution throws", async () => {
    req.headers["x-tenant-id"] = "1";
    db.tenant.findOne.mockRejectedValue(new Error("DB down"));

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to resolve tenant.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("caches tenant lookup result on hit", async () => {
    const tenant = { id: 1, name: "Accra", slug: "accra", toJSON: () => ({ id: 1, name: "Accra", slug: "accra" }) };
    db.tenant.findOne.mockResolvedValue(tenant);
    req.headers["x-tenant-id"] = "1";

    await resolveTenant(req, res, next);

    const cache = require("../utils/cache").cache;
    expect(cache.set).toHaveBeenCalledWith("tenant:id:1", expect.any(Object), 300);
  });

  it("caches negative lookup as __NOT_FOUND__", async () => {
    req.headers["x-tenant-id"] = "9999";
    db.tenant.findOne.mockResolvedValue(null);

    await resolveTenant(req, res, next);

    const cache = require("../utils/cache").cache;
    expect(cache.set).toHaveBeenCalledWith("tenant:id:9999", "__NOT_FOUND__", 30);
  });

  it("uses slug cache keys for slug lookups", async () => {
    req.headers["x-tenant-slug"] = "accra";
    db.tenant.findOne.mockResolvedValue({ id: 1, slug: "accra", toJSON: () => ({ id: 1, slug: "accra" }) });

    await resolveTenant(req, res, next);

    expect(db.tenant.findOne).toHaveBeenCalledWith({ where: { slug: "accra" } });
  });
});

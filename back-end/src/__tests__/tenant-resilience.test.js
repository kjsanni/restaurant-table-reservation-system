jest.mock("../utils/cache", () => ({
  client: {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
  },
  getConnectionStatus: jest.fn().mockReturnValue(true),
}));

const { tenantBurstQuota, tenantCircuitBreaker } = require("../tenant-platform/middleware/tenantResilience");

describe("Tenant Resilience Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows requests within burst quota", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
    const next = jest.fn();
    await tenantBurstQuota(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks requests exceeding burst quota", async () => {
    const { client } = require("../utils/cache");
    client.incr.mockResolvedValue(20);
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };
    const next = jest.fn();
    await tenantBurstQuota(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it("allows requests when circuit is closed", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await tenantCircuitBreaker(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks requests when circuit is open", async () => {
    const { client } = require("../utils/cache");
    client.get.mockResolvedValue("5");
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await tenantCircuitBreaker(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});

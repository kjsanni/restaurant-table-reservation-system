"use strict";

jest.mock("../utils/cache", () => ({
  client: null,
  getConnectionStatus: () => false,
}));

const { tenantLimiter, makeTenantLimiter } = require("../tenant-platform/middleware/tenantRateLimit");

describe("tenantRateLimit middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      tenant: { id: 7 },
      ip: "127.0.0.1",
      path: "/api/v1/reservations",
      method: "GET",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("allows requests when tenant is present and Redis is unavailable in non-production", async () => {
    process.env.NODE_ENV = "test";
    await tenantLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("falls back to memory store when Redis is unavailable", async () => {
    process.env.NODE_ENV = "production";
    const limiter = makeTenantLimiter({
      windowMs: 60 * 1000,
      max: 10,
      message: "Too many requests.",
      redisPrefix: "rl:test:",
    });
    await limiter(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("skips rate limiting when req.tenant is missing", async () => {
    req.tenant = undefined;
    await tenantLimiter(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

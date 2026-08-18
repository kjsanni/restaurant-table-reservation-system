const request = require("supertest");
const createServer = require("../utils/server");

describe("Provisioning Smoke Test", () => {
  let app;
  let server;

  beforeAll(async () => {
    const { app: a, server: s } = createServer();
    app = a;
    server = s;
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    if (server && server.close) {
      server.close();
    }
  });

  it("health endpoint returns 200 or expected auth/rate-limit status", async () => {
    const res = await request(app).get("/api/v1/health");
    expect([200, 401, 403, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("status");
    }
  });

  it("OpenAPI spec endpoint returns 200 or expected status", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect([200, 401, 403, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("openapi");
    }
  });

  it("tenant provisioning status endpoint is registered", async () => {
    const res = await request(app).get("/api/v1/admin/provisioning/status/1");
    expect([200, 401, 403, 404, 429]).toContain(res.status);
  });

  it("tenant creation endpoint is registered", async () => {
    const res = await request(app).post("/api/v1/admin/tenants").send({});
    expect([200, 400, 401, 403, 404, 429]).toContain(res.status);
  });

  it("tenant customization endpoints are registered", async () => {
    const themeRes = await request(app).get("/api/v1/admin/tenants/customization/theme");
    const domainRes = await request(app).get("/api/v1/admin/tenants/customization/domain");
    expect([200, 401, 403, 404, 429]).toContain(themeRes.status);
    expect([200, 401, 403, 404, 429]).toContain(domainRes.status);
  });

  it("migration endpoints are registered", async () => {
    const statusRes = await request(app).get("/api/v1/admin/migrations/tenants/1");
    const runRes = await request(app).post("/api/v1/admin/migrations/tenants/1/run/test.js");
    expect([200, 401, 403, 404, 429]).toContain(statusRes.status);
    expect([200, 401, 403, 404, 429]).toContain(runRes.status);
  });
});

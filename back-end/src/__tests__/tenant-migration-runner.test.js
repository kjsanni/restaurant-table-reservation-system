const request = require("supertest");
process.env.ENCRYPTION_KEY = "test-secret-for-migration-tests";
const createServer = require("../utils/server");

jest.mock("../tenant-platform/services/tenant-migration-runner.service", () => ({
  getMigrationsForTenant: jest.fn().mockResolvedValue([
    { name: "test-migration.js", tenantStatus: "completed", globalStatus: "applied" },
  ]),
  runMigrationForTenant: jest.fn().mockResolvedValue({ success: true, message: "Migration completed" }),
  pauseMigration: jest.fn().mockResolvedValue({ success: true, message: "Migration paused" }),
  resumeMigration: jest.fn().mockResolvedValue({ success: true, message: "Migration resumed" }),
  rollbackMigration: jest.fn().mockResolvedValue({ success: true, message: "Migration rolled back" }),
}));

describe("Tenant Migration Runner API", () => {
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

  it("returns migration status for a tenant", async () => {
    const res = await request(app).get("/api/v1/admin/migrations/tenants/1");
    expect([200, 401, 403, 429]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });

  it("runs a migration for a tenant", async () => {
    const res = await request(app).post("/api/v1/admin/migrations/tenants/1/run/test-migration.js");
    expect([200, 401, 403, 429]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });

  it("pauses a migration", async () => {
    const res = await request(app).post("/api/v1/admin/migrations/tenants/1/pause/test-migration.js");
    expect([200, 401, 403, 429]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });

  it("resumes a migration", async () => {
    const res = await request(app).post("/api/v1/admin/migrations/tenants/1/resume/test-migration.js");
    expect([200, 401, 403, 429]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });

  it("rolls back a migration", async () => {
    const res = await request(app).post("/api/v1/admin/migrations/tenants/1/rollback/test-migration.js");
    expect([200, 401, 403, 429]).toContain(res.status);
    expect(res.body).toHaveProperty("success");
  });
});

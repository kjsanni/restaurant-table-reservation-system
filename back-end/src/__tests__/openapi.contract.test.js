const request = require("supertest");
const createServer = require("../utils/server");
const fs = require("fs");
const path = require("path");

describe("OpenAPI Contract Tests", () => {
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

  it("serves OpenAPI spec at /api/v1/openapi.json", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("RTRS API");
    expect(res.body.paths).toBeDefined();
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });

  it("serves Swagger UI at /api/v1/docs", async () => {
    const res = await request(app).get("/api/v1/docs").redirects(0);
    expect([200, 301, 302]).toContain(res.status);
    expect(res.headers.location || res.text).toBeDefined();
  });

  it("includes API version header on API responses", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["api-version"] || res.headers["API-Version"]).toBe("1.0.0");
  });

  it("OpenAPI spec includes at least one tagged route group", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect(res.body.tags.length).toBeGreaterThan(0);
  });
});

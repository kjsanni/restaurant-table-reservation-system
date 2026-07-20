const request = require("supertest");
const app = require("../utils/server");
const db = require("../db/models");
const { authenticate, authenticateAdmin, csrfToken } = require("../../__tests__/helpers/auth.helper");

describe("Promotion Controller", () => {
  let adminToken;
  let csrf;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    const auth = await authenticateAdmin(db);
    adminToken = auth.token;
    csrf = csrfToken();
  });

  describe("GET /promotions", () => {
    it("returns empty list when no promotions exist", async () => {
      const res = await request(app)
        .get("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.collection)).toBe(true);
    });
  });

  describe("POST /promotions", () => {
    it("creates a promotion", async () => {
      const res = await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "TEST20",
          discountType: "percentage",
          discountValue: 20,
          isActive: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.promotion.code).toBe("TEST20");
    });

    it("rejects invalid CSRF", async () => {
      await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "BAD",
          discountType: "percentage",
          discountValue: 10,
        })
        .expect(403);
    });
  });

  describe("POST /promotions/validate", () => {
    it("validates a promotion code", async () => {
      await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "VALID10",
          discountType: "fixed",
          discountValue: 10,
          minOrderAmount: 0,
        });

      const res = await request(app)
        .post("/api/v1/promotions/validate")
        .send({ code: "VALID10", orderTotal: 50 })
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.discountAmount).toBe(10);
    });

    it("rejects code below minimum", async () => {
      await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "MIN50",
          discountType: "percentage",
          discountValue: 10,
          minOrderAmount: 50,
        });

      const res = await request(app)
        .post("/api/v1/promotions/validate")
        .send({ code: "MIN50", orderTotal: 20 })
        .expect(200);

      expect(res.body.valid).toBe(false);
    });
  });

  describe("GET /promotions/:id", () => {
    it("returns a promotion by id", async () => {
      const createRes = await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "GET1",
          discountType: "fixed",
          discountValue: 5,
        });

      const id = createRes.body.promotion.id;

      const res = await request(app)
        .get(`/api/v1/promotions/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .expect(200);

      expect(res.body.promotion.code).toBe("GET1");
    });
  });

  describe("PATCH /promotions/:id", () => {
    it("updates a promotion", async () => {
      const createRes = await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "PATCH1",
          discountType: "fixed",
          discountValue: 5,
        });

      const id = createRes.body.promotion.id;

      const res = await request(app)
        .patch(`/api/v1/promotions/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({ discountValue: 15 })
        .expect(200);

      expect(res.body.promotion.discountValue).toBe(15);
    });
  });

  describe("DELETE /promotions/:id", () => {
    it("deletes a promotion", async () => {
      const createRes = await request(app)
        .post("/api/v1/promotions")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .send({
          code: "DEL1",
          discountType: "fixed",
          discountValue: 5,
        });

      const id = createRes.body.promotion.id;

      await request(app)
        .delete(`/api/v1/promotions/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .expect(200);

      const res = await request(app)
        .get(`/api/v1/promotions/${id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("X-CSRF-Token", csrf)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});

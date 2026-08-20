"use strict";

const reviewController = require("../controllers/review.controller");

describe("review.controller - customer flow", () => {
  const mockReservation = {
    id: 1,
    tenantId: 10,
    customerId: 100,
    resStatus: "completed",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCustomerReviewHandler", () => {
    it("creates a review for a completed reservation", async () => {
      const req = {
        user: { id: 100, email: "alice@example.com" },
        tenant: { id: 10 },
        body: { reservationId: 1, rating: 5, comment: "Great!" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      jest.spyOn(require("../DAOs/reservation.dao"), "findOrCreateCustomer").mockResolvedValue({ id: 100 });
      jest.spyOn(require("../DAOs/reservation.dao"), "findReservationById").mockResolvedValue(mockReservation);
      jest.spyOn(require("../DAOs/review.dao"), "findByReservation").mockResolvedValue(null);
      jest.spyOn(require("../DAOs/review.dao"), "createReview").mockResolvedValue({
        id: 1,
        reservationId: 1,
        customerId: 100,
        rating: 5,
        comment: "Great!",
        channel: "customer_portal",
      });

      await reviewController.createCustomerReviewHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        review: expect.objectContaining({ rating: 5, comment: "Great!" }),
      });
    });

    it("rejects review for reservation not owned by customer", async () => {
      const req = {
        user: { id: 999, email: "other@example.com" },
        tenant: { id: 10 },
        body: { reservationId: 1, rating: 5 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      jest.spyOn(require("../DAOs/reservation.dao"), "findOrCreateCustomer").mockResolvedValue({ id: 999 });
      jest.spyOn(require("../DAOs/reservation.dao"), "findReservationById").mockResolvedValue(mockReservation);

      await reviewController.createCustomerReviewHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to review this reservation",
      });
    });

    it("rejects review for incomplete reservation", async () => {
      const req = {
        user: { id: 100, email: "alice@example.com" },
        tenant: { id: 10 },
        body: { reservationId: 1, rating: 5 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      jest.spyOn(require("../DAOs/reservation.dao"), "findOrCreateCustomer").mockResolvedValue({ id: 100 });
      jest.spyOn(require("../DAOs/reservation.dao"), "findReservationById").mockResolvedValue({
        ...mockReservation,
        resStatus: "pending",
      });

      await reviewController.createCustomerReviewHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Can only review completed reservations",
      });
    });

    it("rejects duplicate review", async () => {
      const req = {
        user: { id: 100, email: "alice@example.com" },
        tenant: { id: 10 },
        body: { reservationId: 1, rating: 5 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      jest.spyOn(require("../DAOs/reservation.dao"), "findOrCreateCustomer").mockResolvedValue({ id: 100 });
      jest.spyOn(require("../DAOs/reservation.dao"), "findReservationById").mockResolvedValue(mockReservation);
      jest.spyOn(require("../DAOs/review.dao"), "findByReservation").mockResolvedValue({ id: 1 });

      await reviewController.createCustomerReviewHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Review already submitted for this reservation",
      });
    });
  });

  describe("getCustomerReviewsHandler", () => {
    it("returns reviews for the authenticated customer", async () => {
      const req = {
        user: { id: 100, email: "alice@example.com" },
        tenant: { id: 10 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      jest.spyOn(require("../DAOs/reservation.dao"), "findOrCreateCustomer").mockResolvedValue({ id: 100 });
      jest.spyOn(require("../DAOs/review.dao"), "findByCustomer").mockResolvedValue([
        { id: 1, rating: 5, comment: "Great", createdAt: "2026-08-10" },
      ]);

      await reviewController.getCustomerReviewsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        reviews: [{ id: 1, rating: 5, comment: "Great", createdAt: "2026-08-10" }],
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      const req = {
        user: null,
        tenant: { id: 10 },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await reviewController.getCustomerReviewsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

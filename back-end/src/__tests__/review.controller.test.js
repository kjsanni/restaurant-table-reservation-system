const reviewController = require("../controllers/review.controller");

jest.mock("../DAOs/review.dao");
jest.mock("../DAOs/reservation.dao");

const reviewDAO = require("../DAOs/review.dao");
const reservationDAO = require("../DAOs/reservation.dao");

describe("Review controller", () => {
  beforeEach(() => jest.clearAllMocks());

  it("createReviewHandler creates review", async () => {
    const req = {
      tenant: { id: 1 },
      body: { reservationId: 1, rating: 5, comment: "Great", channel: "web" },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, customerId: 1 });
    reviewDAO.findByReservation.mockResolvedValue(null);
    reviewDAO.createReview.mockResolvedValue({ id: 1, rating: 5 });

    await reviewController.createReviewHandler(req, res);
    expect(reviewDAO.createReview).toHaveBeenCalledWith(
      expect.objectContaining({ reservationId: 1, rating: 5 }),
      1
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("createReviewHandler rejects duplicate review", async () => {
    const req = {
      tenant: { id: 1 },
      body: { reservationId: 1, rating: 5 },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, customerId: 1 });
    reviewDAO.findByReservation.mockResolvedValue({ id: 1 });

    await reviewController.createReviewHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(reviewDAO.createReview).not.toHaveBeenCalled();
  });

  it("getReviewsHandler returns paginated reviews", async () => {
    const req = { tenant: { id: 1 }, query: {} };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reviewDAO.getAllForTenant.mockResolvedValue({ reviews: [], total: 0 });

    await reviewController.getReviewsHandler(req, res);
    expect(reviewDAO.getAllForTenant).toHaveBeenCalledWith(1, {}, {});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("respondToReviewHandler updates review with response", async () => {
    const req = {
      tenant: { id: 1 },
      params: { id: 1 },
      body: { response: "Thanks!" },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reviewDAO.updateReview.mockResolvedValue({ id: 1, response: "Thanks!" });

    await reviewController.respondToReviewHandler(req, res);
    expect(reviewDAO.updateReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ response: "Thanks!" }),
      1
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getAverageRatingHandler returns stats", async () => {
    const req = { tenant: { id: 1 } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    reviewDAO.getAverageRating.mockResolvedValue({ average: 4.5, count: 10 });

    await reviewController.getAverageRatingHandler(req, res);
    expect(reviewDAO.getAverageRating).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, average: 4.5, count: 10 });
  });
});

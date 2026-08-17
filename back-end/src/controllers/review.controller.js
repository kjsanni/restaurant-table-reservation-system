const reviewDAO = require("../DAOs/review.dao");
const reservationDAO = require("../DAOs/reservation.dao");
const { sendEmail } = require("../services/emailService");
const db = require("../db/models");

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
};

const sendReviewResponseNotification = async (review, tenant) => {
  try {
    const customer = await db.customer.findByPk(review.customerId); // codacy-suppress nosql-injection - parameterized ORM call
    if (!customer?.email) return;
    const brandName = tenant?.name || "Vibespot";
    const safeComment = escapeHtml(review.comment || "(no comment)");
    const safeResponse = escapeHtml(review.response || "");
    await sendEmail({
      to: customer.email,
      subject: `We responded to your review of ${brandName}`,
      // nosemgrep: raw-html-format - all variables are HTML-escaped
      html: `<p>Hi ${escapeHtml(customer.firstName || "there")},</p><p>We've just responded to your review of <strong>${escapeHtml(brandName)}</strong>. Thank you for your feedback!</p><p>Your review:</p><blockquote>${safeComment}</blockquote><p>Our response:</p><blockquote>${safeResponse}</blockquote><p>— ${escapeHtml(brandName)} Team</p>`, // nosemgrep: raw-html-format - all interpolated values are HTML-escaped by escapeHtml()
    });
  } catch (err) {
    console.error("sendReviewResponseNotification error:", err.message);
  }
};

const createReviewHandler = async (req, res) => {
  try {
    const { reservationId, rating, comment, channel } = req.body;
    if (!reservationId || !rating) {
      return res.status(400).json({ success: false, message: "reservationId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const reservation = await reservationDAO.findReservationById(reservationId, req.tenant?.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    const existing = await reviewDAO.findByReservation(reservationId, req.tenant?.id);
    if (existing) {
      return res.status(400).json({ success: false, message: "Review already submitted for this reservation" });
    }

    const review = await reviewDAO.createReview({
      reservationId,
      customerId: reservation.customerId,
      rating,
      comment: comment || null,
      channel: channel || null,
    }, req.tenant?.id);

    return res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("createReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

const getReviewsHandler = async (req, res) => {
  try {
    const filters = {};
    if (req.query.rating) filters.rating = parseInt(req.query.rating, 10);
    if (req.query.from) filters.from = req.query.from;
    if (req.query.to) filters.to = req.query.to;

    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : undefined;
    const pagination = {};
    if (page && pageSize) {
      pagination.limit = pageSize;
      pagination.offset = (page - 1) * pageSize;
    }

    const result = await reviewDAO.getAllForTenant(req.tenant?.id, filters, pagination);
    const response = { success: true };
    if (pagination.limit) {
      response.collection = result.reviews;
      response.total = result.total;
      response.page = page;
      response.pageSize = pageSize;
    } else {
      response.collection = result.reviews;
    }
    return res.status(200).json(response);
  } catch (err) {
    console.error("getReviewsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
};

const getReviewHandler = async (req, res) => {
  try {
    const review = await reviewDAO.findById(req.params.id, req.tenant?.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    return res.status(200).json({ success: true, review });
  } catch (err) {
    console.error("getReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load review" });
  }
};

const respondToReviewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response) {
      return res.status(400).json({ success: false, message: "Response is required" });
    }
    const updated = await reviewDAO.updateReview(id, {
      response,
      respondedAt: new Date(),
    }, req.tenant?.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const tenant = await db.tenant.findByPk(req.tenant?.id); // codacy-suppress nosql-injection - parameterized ORM call
    sendReviewResponseNotification(updated, tenant);

    return res.status(200).json({ success: true, review: updated });
  } catch (err) {
    console.error("respondToReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to respond to review" });
  }
};

const deleteReviewHandler = async (req, res) => {
  try {
    const removed = await reviewDAO.deleteReview(req.params.id, req.tenant?.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (err) {
    console.error("deleteReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

const getAverageRatingHandler = async (req, res) => {
  try {
    const stats = await reviewDAO.getAverageRating(req.tenant?.id);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    console.error("getAverageRatingHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load rating stats" });
  }
};

const getCustomerReviewsHandler = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const reviews = await reviewDAO.findByCustomer(customerId, req.tenant?.id, 50);
    return res.status(200).json({ success: true, reviews });
  } catch (err) {
    console.error("getCustomerReviewsHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
};

const createCustomerReviewHandler = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { reservationId, rating, comment } = req.body;
    if (!reservationId || !rating) {
      return res.status(400).json({ success: false, message: "reservationId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const reservation = await reservationDAO.findReservationById(reservationId, req.tenant?.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    if (reservation.customerId !== customerId) {
      return res.status(403).json({ success: false, message: "Not authorized to review this reservation" });
    }

    const resStatus = reservation.resStatus || reservation.reservationStatus;
    if (resStatus !== "completed" && resStatus !== "seated") {
      return res.status(400).json({ success: false, message: "Can only review completed reservations" });
    }

    const existing = await reviewDAO.findByReservation(reservationId, req.tenant?.id);
    if (existing) {
      return res.status(400).json({ success: false, message: "Review already submitted for this reservation" });
    }

    const review = await reviewDAO.createReview({
      reservationId,
      customerId,
      rating,
      comment: comment || null,
      channel: "customer_portal",
    }, req.tenant?.id);

    return res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("createCustomerReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

const flagReviewHandler = async (req, res) => {
  try {
    const { reason } = req.body;
    const updated = await reviewDAO.flagReview(req.params.id, req.tenant?.id, reason);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    return res.status(200).json({ success: true, review: updated });
  } catch (err) {
    console.error("flagReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to flag review" });
  }
};

const unflagReviewHandler = async (req, res) => {
  try {
    const updated = await reviewDAO.unflagReview(req.params.id, req.tenant?.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    return res.status(200).json({ success: true, review: updated });
  } catch (err) {
    console.error("unflagReviewHandler error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to unflag review" });
  }
};

module.exports = {
  createReviewHandler,
  getReviewsHandler,
  getReviewHandler,
  respondToReviewHandler,
  deleteReviewHandler,
  getAverageRatingHandler,
  getCustomerReviewsHandler,
  createCustomerReviewHandler,
  flagReviewHandler,
  unflagReviewHandler,
};

const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const reviewController = require("../controllers/review.controller");
const { protect, staff } = require("../middleware/auth");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/")
  .get(protectedRoute("manage_settings", reviewController.getReviewsHandler))
  .post(writeRoute("manage_settings", reviewController.createReviewHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/average")
  .get(protectedRoute("manage_settings", reviewController.getAverageRatingHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(protectedRoute("manage_settings", reviewController.getReviewHandler))
  .patch(writeRoute("manage_settings", reviewController.respondToReviewHandler), validateCsrfToken)
  .delete(writeRoute("manage_settings", reviewController.deleteReviewHandler))
  .all(httpMethodError);

module.exports = router;

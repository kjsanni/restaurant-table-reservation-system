const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const reviewController = require("../controllers/review.controller");
const { _protect, _staff } = require("../middleware/auth");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(generalLimiter), ...protectedRoute("manage_settings", reviewController.getReviewsHandler))
  .post(writeRoute("manage_settings", reviewController.createReviewHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/average")
  .get(tryCatchHandler(generalLimiter), ...protectedRoute("manage_settings", reviewController.getAverageRatingHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(generalLimiter), ...protectedRoute("manage_settings", reviewController.getReviewHandler))
  .patch(writeRoute("manage_settings", reviewController.respondToReviewHandler), validateCsrfToken)
  .delete(writeRoute("manage_settings", reviewController.deleteReviewHandler))
  .post(writeRoute("manage_settings", reviewController.flagReviewHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/:id/unflag")
  .post(writeRoute("manage_settings", reviewController.unflagReviewHandler), validateCsrfToken)
  .all(httpMethodError);

module.exports = router;

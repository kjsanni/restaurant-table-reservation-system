// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via generalLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const customerPortalController = require("../controllers/customer-portal.controller");
const customerWaitlistController = require("../controllers/customer-waitlist.controller");
const customerLoyaltyController = require("../controllers/customer-loyalty.controller");
const customerMarketingController = require("../controllers/customer-marketing.controller");
const reviewController = require("../controllers/review.controller");
const { protect } = require("../middleware/auth");
const { validateCsrfToken } = require("../middleware/csrf");
const { generalLimiter } = require("../middleware/rateLimit");

router
  .route("/profile")
  .get(protect, generalLimiter, customerPortalController.getCustomerProfileHandler)
  .patch(protect, generalLimiter, validateCsrfToken, customerPortalController.updateCustomerProfileHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(protect, generalLimiter, customerPortalController.getCustomerReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservations/:reservationId/cancel")
  .post(protect, generalLimiter, validateCsrfToken, customerPortalController.cancelReservationHandler)
  .all(httpMethodError);

router
  .route("/waitlist")
  .get(protect, generalLimiter, customerWaitlistController.getCustomerWaitlistHandler)
  .post(protect, generalLimiter, validateCsrfToken, customerWaitlistController.joinWaitlistHandler)
  .all(httpMethodError);

router
  .route("/waitlist/:id/cancel")
  .post(protect, generalLimiter, validateCsrfToken, customerWaitlistController.cancelWaitlistEntryHandler)
  .all(httpMethodError);

router
  .route("/loyalty")
  .get(protect, generalLimiter, customerLoyaltyController.getLoyaltyHandler)
  .all(httpMethodError);

router
  .route("/loyalty/redeem")
  .post(protect, generalLimiter, validateCsrfToken, customerLoyaltyController.redeemPointsHandler)
  .all(httpMethodError);

router
  .route("/promotions")
  .get(protect, generalLimiter, customerMarketingController.getPromotionsHandler)
  .all(httpMethodError);

router
  .route("/promotions/:promotionId")
  .get(protect, generalLimiter, customerMarketingController.getPromotionHandler)
  .all(httpMethodError);

router
  .route("/reviews")
  .get(protect, generalLimiter, reviewController.getCustomerReviewsHandler)
  .all(httpMethodError);

router
  .route("/reviews")
  .post(protect, generalLimiter, validateCsrfToken, reviewController.createCustomerReviewHandler)
  .all(httpMethodError);

module.exports = router;

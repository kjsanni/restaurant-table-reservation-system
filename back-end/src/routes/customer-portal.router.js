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
const upload = require("../tenant-platform/middleware/supportAttachmentUpload");

router
  .route("/profile")
  .get(protect, customerPortalController.getCustomerProfileHandler)
  .patch(protect, customerPortalController.updateCustomerProfileHandler)
  .all(httpMethodError);

router
  .route("/reservations")
  .get(protect, customerPortalController.getCustomerReservationsHandler)
  .all(httpMethodError);

router
  .route("/reservations/:reservationId/cancel")
  .post(protect, customerPortalController.cancelReservationHandler)
  .all(httpMethodError);

router
  .route("/waitlist")
  .get(protect, customerWaitlistController.getCustomerWaitlistHandler)
  .post(protect, validateCsrfToken, customerWaitlistController.joinWaitlistHandler)
  .all(httpMethodError);

router
  .route("/waitlist/:id/cancel")
  .post(protect, validateCsrfToken, customerWaitlistController.cancelWaitlistEntryHandler)
  .all(httpMethodError);

router
  .route("/loyalty")
  .get(protect, customerLoyaltyController.getLoyaltyHandler)
  .all(httpMethodError);

router
  .route("/loyalty/redeem")
  .post(protect, validateCsrfToken, customerLoyaltyController.redeemPointsHandler)
  .all(httpMethodError);

router
  .route("/promotions")
  .get(protect, customerMarketingController.getPromotionsHandler)
  .all(httpMethodError);

router
  .route("/promotions/:promotionId")
  .get(protect, customerMarketingController.getPromotionHandler)
  .all(httpMethodError);

router
  .route("/reviews")
  .get(protect, reviewController.getCustomerReviewsHandler)
  .all(httpMethodError);

router
  .route("/reviews")
  .post(protect, validateCsrfToken, reviewController.createCustomerReviewHandler)
  .all(httpMethodError);

router
  .route("/support-tickets")
  .get(protect, customerPortalController.listCustomerTicketsHandler)
  .post(protect, validateCsrfToken, customerPortalController.createCustomerTicketHandler)
  .all(httpMethodError);

router
  .route("/support-tickets/:id")
  .get(protect, customerPortalController.getCustomerTicketHandler)
  .all(httpMethodError);

router
  .route("/support-tickets/:id/messages")
  .get(protect, customerPortalController.listCustomerMessagesHandler)
  .post(protect, validateCsrfToken, customerPortalController.sendCustomerMessageHandler)
  .all(httpMethodError);

router
  .route("/support-tickets/:id/attachments")
  .get(protect, customerPortalController.listCustomerAttachmentsHandler)
  .post(protect, validateCsrfToken, upload.single("file"), customerPortalController.createCustomerAttachmentHandler)
  .all(httpMethodError);

router
  .route("/support-tickets/:id/attachments/download/:filename")
  .get(protect, customerPortalController.downloadCustomerAttachmentHandler)
  .all(httpMethodError);

module.exports = router;

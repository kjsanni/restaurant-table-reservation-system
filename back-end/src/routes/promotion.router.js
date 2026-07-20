const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const promotionController = require("../controllers/promotion.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");

router
  .route("/")
  .get(protectedRoute("manage_settings", promotionController.getPromotionsHandler))
  .post(writeRoute("manage_settings", promotionController.createPromotionHandler), validateCsrfToken)
  .all(httpMethodError);

router
  .route("/validate")
  .post(promotionController.validatePromotionHandler)
  .all(httpMethodError);

router
  .route("/:promotionId")
  .get(protectedRoute("manage_settings", promotionController.getPromotionHandler))
  .patch(writeRoute("manage_settings", promotionController.updatePromotionHandler), validateCsrfToken)
  .delete(writeRoute("manage_settings", promotionController.deletePromotionHandler), validateCsrfToken)
  .all(httpMethodError);

module.exports = router;

const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const webhookEndpointController = require("../controllers/webhookEndpoint.controller");
const { protect } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(webhookEndpointController.listWebhookEndpointsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(webhookEndpointController.createWebhookEndpointHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(webhookEndpointController.updateWebhookEndpointHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(webhookEndpointController.deleteWebhookEndpointHandler))
  .all(httpMethodError);

module.exports = router;

const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const emailTemplateController = require("../controllers/emailTemplate.controller");

router
  .route("/")
  .get(...protectedRoute("manage_settings", emailTemplateController.getAllHandler))
  .post(...writeRoute("manage_settings", emailTemplateController.createHandler))
  .all(httpMethodError);

router
  .route("/test-email")
  .post(...writeRoute("manage_settings", emailTemplateController.sendTestEmailHandler))
  .all(httpMethodError);

router
  .route("/test-template")
  .post(...writeRoute("manage_settings", emailTemplateController.sendTemplateTestHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(...protectedRoute("manage_settings", emailTemplateController.getByIdHandler))
  .patch(...writeRoute("manage_settings", emailTemplateController.updateHandler))
  .delete(...writeRoute("manage_settings", emailTemplateController.deleteHandler))
  .all(httpMethodError);

module.exports = router;
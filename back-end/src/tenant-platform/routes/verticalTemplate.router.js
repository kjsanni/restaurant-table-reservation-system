
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const verticalTemplateController = require("../controllers/verticalTemplate.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.listTemplatesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.createTemplateHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.updateTemplateHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.deleteTemplateHandler))
  .all(httpMethodError);

router
  .route("/:id/clone")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.cloneTemplateHandler))
  .all(httpMethodError);

router
  .route("/usage")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalTemplateController.getTemplateUsageHandler))
  .all(httpMethodError);

module.exports = router;

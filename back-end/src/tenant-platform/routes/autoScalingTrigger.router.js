const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const autoScalingTriggerController = require("../controllers/autoScalingTrigger.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(autoScalingTriggerController.listAutoScalingTriggersHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(autoScalingTriggerController.createAutoScalingTriggerHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(autoScalingTriggerController.getAutoScalingTriggerHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(autoScalingTriggerController.updateAutoScalingTriggerHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(autoScalingTriggerController.deleteAutoScalingTriggerHandler))
  .all(httpMethodError);

module.exports = router;

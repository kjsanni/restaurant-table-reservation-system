const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const alertRuleController = require("../controllers/alertRule.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(alertRuleController.listAlertRulesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(alertRuleController.createAlertRuleHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(alertRuleController.getAlertRuleHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(alertRuleController.updateAlertRuleHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(alertRuleController.deleteAlertRuleHandler))
  .all(httpMethodError);

module.exports = router;

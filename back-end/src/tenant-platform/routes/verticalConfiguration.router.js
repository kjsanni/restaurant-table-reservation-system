const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const verticalConfigurationController = require("../controllers/verticalConfiguration.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");
const { requireElevatedSuperAdmin, refreshElevation } = require("../../middleware/breakGlass.middleware");

router
  .route("/vertical-configurations")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalConfigurationController.listVerticalConfigurationsHandler))
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(refreshElevation),
    tryCatchHandler(requireElevatedSuperAdmin),
    tryCatchHandler(verticalConfigurationController.createVerticalConfigurationHandler)
  )
  .all(httpMethodError);

router
  .route("/vertical-configurations/summary")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalConfigurationController.getVerticalConfigurationSummaryHandler))
  .all(httpMethodError);

router
  .route("/vertical-configurations/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(verticalConfigurationController.getVerticalConfigurationHandler))
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(refreshElevation),
    tryCatchHandler(requireElevatedSuperAdmin),
    tryCatchHandler(verticalConfigurationController.updateVerticalConfigurationHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(refreshElevation),
    tryCatchHandler(requireElevatedSuperAdmin),
    tryCatchHandler(verticalConfigurationController.deleteVerticalConfigurationHandler)
  )
  .all(httpMethodError);

module.exports = router;

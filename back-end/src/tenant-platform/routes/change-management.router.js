const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const changeManagementController = require("../controllers/change-management.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/deprecations")
  .get(tryCatchHandler(protect), tryCatchHandler(changeManagementController.getActiveDeprecationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(changeManagementController.createDeprecationNoticeHandler))
  .all(httpMethodError);

router
  .route("/tenants/:tenantId/banners")
  .get(tryCatchHandler(protect), tryCatchHandler(changeManagementController.getTenantBannersHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(changeManagementController.createInAppBannerHandler))
  .all(httpMethodError);

router
  .route("/templates")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(changeManagementController.getNotificationTemplatesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(changeManagementController.createNotificationTemplateHandler))
  .all(httpMethodError);

module.exports = router;

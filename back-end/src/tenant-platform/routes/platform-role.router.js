const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformRoleController = require("../../controllers/platform-role.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/platform/roles")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformRoleController.listPlatformRolesHandler))
  .all(httpMethodError);

router
  .route("/platform/roles/assign")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformRoleController.assignPlatformRoleHandler))
  .all(httpMethodError);

router
  .route("/platform/roles/revoke")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(platformRoleController.revokePlatformRoleHandler))
  .all(httpMethodError);

module.exports = router;

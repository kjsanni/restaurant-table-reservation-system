const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformRoleController = require("../../controllers/platform-role.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/roles")
  .get(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.listPlatformRolesHandler))
  .all(httpMethodError);

router
  .route("/users")
  .get(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.listPlatformUsersHandler))
  .post(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.createPlatformUserHandler))
  .all(httpMethodError);

router
  .route("/roles/assign")
  .post(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.assignPlatformRoleHandler))
  .all(httpMethodError);

router
  .route("/roles/revoke")
  .post(tryCatchHandler(adminActionLimiter), tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.revokePlatformRoleHandler))
  .all(httpMethodError);

module.exports = router;

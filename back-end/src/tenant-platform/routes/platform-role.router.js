const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const platformRoleController = require("../../controllers/platform-role.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/roles")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.listPlatformRolesHandler))
  .all(httpMethodError);

router
  .route("/users")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.listPlatformUsersHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.createPlatformUserHandler))
  .all(httpMethodError);

router
  .route("/roles/assign")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.assignPlatformRoleHandler))
  .all(httpMethodError);

router
  .route("/roles/revoke")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(platformRoleController.revokePlatformRoleHandler))
  .all(httpMethodError);

module.exports = router;

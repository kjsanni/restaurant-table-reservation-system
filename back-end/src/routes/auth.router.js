const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const authController = require("../controllers/auth.controller");
const { protect, admin, requirePermission } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/register/status")
  .get(tryCatchHandler(authController.registerStatusHandler))
  .all(httpMethodError);

router.route("/register").post(authLimiter, tryCatchHandler(authController.registerHandler));

router.route("/login").post(authLimiter, tryCatchHandler(authController.loginHandler));

router.route("/logout").post(...protectedRoute("", authController.logoutHandler));

router
  .route("/me")
  .get(...protectedRoute("", authController.getMeHandler));

router
  .route("/settings")
  .get(tryCatchHandler(protect), tryCatchHandler(admin), tryCatchHandler(authController.getSettingsHandler))
  .put(tryCatchHandler(protect), tryCatchHandler(admin), tryCatchHandler(authController.updateSettingsHandler));

router
  .route("/staff")
  .get(...protectedRoute("manage_staff", authController.getAllStaffHandler))
  .post(...writeRoute("manage_staff", authController.createStaffHandler))
  .all(httpMethodError);

router
  .route("/staff/:id")
  .patch(...writeRoute("manage_staff", authController.updateStaffHandler))
  .delete(...writeRoute("manage_staff", authController.deleteStaffHandler))
  .all(httpMethodError);

router
  .route("/users")
  .get(...protectedRoute("manage_staff", authController.getAllUsersHandler))
  .all(httpMethodError);

router
  .route("/refresh-token")
  .post(tryCatchHandler(authController.refreshTokenHandler))
  .all(httpMethodError);

router
  .route("/revoke-token")
  .post(...protectedRoute("", authController.revokeTokenHandler))
  .all(httpMethodError);

module.exports = router;

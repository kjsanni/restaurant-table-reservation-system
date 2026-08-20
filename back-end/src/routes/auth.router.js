const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const authController = require("../controllers/auth.controller");
const { protect, admin, requirePermission } = require("../middleware/auth");
const { authLimiter, generalLimiter } = require("../middleware/rateLimit");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");
const { validateCsrfToken } = require("../middleware/csrf");
const enforcePasswordPolicy = require("../middleware/passwordPolicy");
const validateTurnstile = require("../middleware/turnstile");

router
  .route("/register/status")
  .get(tryCatchHandler(authController.registerStatusHandler))
  .all(httpMethodError);

router
  .route("/turnstile-config")
  .get(tryCatchHandler(authController.getTurnstileConfigHandler))
  .all(httpMethodError);

router
  .route("/register")
  .post(
    authLimiter,
    validateTurnstile,
    validateCsrfToken,
    enforcePasswordPolicy,
    tryCatchHandler(authController.registerHandler)
  )
  .all(httpMethodError);

router
  .route("/register/customer")
  .post(
    authLimiter,
    validateTurnstile,
    validateCsrfToken,
    enforcePasswordPolicy,
    tryCatchHandler(authController.registerCustomerHandler)
  )
  .all(httpMethodError);

router.route("/login").post(authLimiter, validateTurnstile, tryCatchHandler(authController.loginHandler));

router
  .route("/login-totp")
  .post(authLimiter, tryCatchHandler(authController.loginTOTPHandler))
  .all(httpMethodError);

router
  .route("/login-whatsapp-otp")
  .post(authLimiter, tryCatchHandler(authController.loginWhatsAppOTPHandler))
  .all(httpMethodError);

router
  .route("/logout")
  .post(
    validateCsrfToken,
    tryCatchHandler(authController.logoutHandler)
  )
  .all(httpMethodError);

router
  .route("/me")
  .get(...protectedRoute("", authController.getMeHandler, true));

router
  .route("/tenant/capabilities")
  .get(...protectedRoute("", authController.getTenantCapabilitiesHandler, true));

router
  .route("/tenant/setup")
  .post(...writeRoute("manage_settings", authController.setupTenantHandler));

router
  .route("/settings")
  .get(generalLimiter, tryCatchHandler(protect), tryCatchHandler(admin), tryCatchHandler(authController.getSettingsHandler))
  .put(generalLimiter, tryCatchHandler(protect), tryCatchHandler(admin), tryCatchHandler(authController.updateSettingsHandler));

router
  .route("/staff")
  .get(...protectedRoute("manage_staff", authController.getAllStaffHandler))
  .post(...writeRoute("manage_staff", authController.createStaffHandler))
  .all(httpMethodError);

router
  .route("/staff/:id")
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_staff")),
    validateCsrfToken,
    tryCatchHandler(enforcePasswordPolicy),
    tryCatchHandler(authController.updateStaffHandler)
  )
  .all(httpMethodError);

router
  .route("/profile")
  .patch(
    tryCatchHandler(protect),
    authLimiter,
    validateCsrfToken,
    tryCatchHandler(authController.updateProfileHandler)
  )
  .all(httpMethodError);

router
  .route("/staff/:id/reset-password")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_staff")),
    validateCsrfToken,
    tryCatchHandler(authController.adminResetStaffPasswordHandler)
  )
  .all(httpMethodError);

router
  .route("/users")
  .get(...protectedRoute("manage_staff", authController.getAllUsersHandler))
  .all(httpMethodError);

router
  .route("/refresh-token")
  .post(authLimiter, validateCsrfToken, tryCatchHandler(authController.refreshTokenHandler))
  .all(httpMethodError);

router
  .route("/revoke-token")
  .post(tryCatchHandler(protect), validateCsrfToken, tryCatchHandler(authController.revokeTokenHandler))
  .all(httpMethodError);

router
  .route("/locale")
  .get(generalLimiter, tryCatchHandler(protect), tryCatchHandler(authController.getLocaleHandler))
  .put(generalLimiter, tryCatchHandler(protect), tryCatchHandler(authController.updateLocaleHandler))
  .all(httpMethodError);

module.exports = router;

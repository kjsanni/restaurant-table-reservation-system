const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const { authLimiter, generalLimiter } = require("../../middleware/rateLimit");
const { validateCsrfToken } = require("../../middleware/csrf");
const enforcePasswordPolicy = require("../../middleware/passwordPolicy");
const publicTenantController = require("../controllers/publicTenant.controller");
const tenantSignupController = require("../../controllers/tenant-signup.controller");

router
  .route("/signup")
  .post(
    generalLimiter,
    validateCsrfToken,
    enforcePasswordPolicy,
    tryCatchHandler(tenantSignupController.signupTenantHandler)
  )
  .all(httpMethodError);

router
  .route("/:slug")
  .get(authLimiter, tryCatchHandler(publicTenantController.getBySlugHandler))
  .all(httpMethodError);

module.exports = router;

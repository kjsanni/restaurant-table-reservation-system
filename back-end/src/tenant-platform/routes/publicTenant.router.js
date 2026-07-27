const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const { authLimiter } = require("../../middleware/rateLimit");
const publicTenantController = require("../controllers/publicTenant.controller");

router
  .route("/:slug")
  .get(authLimiter, tryCatchHandler(publicTenantController.getBySlugHandler))
  .all(httpMethodError);

module.exports = router;

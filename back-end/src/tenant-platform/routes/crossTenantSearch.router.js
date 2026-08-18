const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const crossTenantSearchController = require("../controllers/crossTenantSearch.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/search")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(crossTenantSearchController.searchHandler))
  .all(httpMethodError);

module.exports = router;

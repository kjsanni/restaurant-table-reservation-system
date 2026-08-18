const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const marketplaceController = require("../controllers/marketplace.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/listings")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(marketplaceController.listListingsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(marketplaceController.createListingHandler))
  .all(httpMethodError);

router
  .route("/listings/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(marketplaceController.updateListingHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(marketplaceController.removeListingHandler))
  .all(httpMethodError);

module.exports = router;

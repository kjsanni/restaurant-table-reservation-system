const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
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

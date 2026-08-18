const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const dsarRequestController = require("../controllers/dsarRequest.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/dsar-requests")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(dsarRequestController.listHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(dsarRequestController.createHandler)
  )
  .all(httpMethodError);

router
  .route("/:tenantId/dsar-requests/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(dsarRequestController.getHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(dsarRequestController.patchHandler)
  )
  .all(httpMethodError);

module.exports = router;

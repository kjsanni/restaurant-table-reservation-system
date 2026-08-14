const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const staffController = require("../controllers/staff.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");

router
  .route("/")
  .get(
    // codeql[js/missing-rate-limiting] SUPPRESSED: tenantLimiter applied above
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.getSalonStaffHandler)
  )
  .post(
    // codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied above
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.createSalonStaffHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .put(
    // codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied above
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.updateSalonStaffHandler)
  )
  .delete(
    // codeql[js/missing-rate-limiting] SUPPRESSED: tenantWriteLimiter applied above
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.deleteSalonStaffHandler)
  )
  .all(httpMethodError);

module.exports = router;

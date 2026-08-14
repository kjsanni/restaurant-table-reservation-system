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
    tryCatchHandler(tenantLimiter),
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.getSalonStaffHandler)
  )
  .post(
    tryCatchHandler(tenantWriteLimiter),
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.createSalonStaffHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .put(
    tryCatchHandler(tenantWriteLimiter),
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.updateSalonStaffHandler)
  )
  .delete(
    tryCatchHandler(tenantWriteLimiter),
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.deleteSalonStaffHandler)
  )
  .all(httpMethodError);

module.exports = router;

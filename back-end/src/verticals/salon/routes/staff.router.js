const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const staffController = require("../controllers/staff.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.getSalonStaffHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.createSalonStaffHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .put(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.updateSalonStaffHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_staff")),
    tryCatchHandler(staffController.deleteSalonStaffHandler)
  )
  .all(httpMethodError);

module.exports = router;

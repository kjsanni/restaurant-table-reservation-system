const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const staffController = require("../controllers/staff.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireVertical("salon")), tryCatchHandler(requirePermission("manage_staff")), tryCatchHandler(staffController.getSalonStaffHandler))
  .all(httpMethodError);

module.exports = router;

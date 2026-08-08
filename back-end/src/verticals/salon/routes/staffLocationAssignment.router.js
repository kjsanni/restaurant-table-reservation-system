"use strict";
const router = require("express").Router();
const staffLocationAssignmentController = require("../controllers/staffLocationAssignment.controller");
const { protect, requireVertical, requirePermission } = require("../../../middleware/auth");

router.use(protect, requireVertical("salon"), requirePermission("manage_staff"));

router.route("/").get(staffLocationAssignmentController.getStaffLocationAssignmentsHandler).post(staffLocationAssignmentController.createStaffLocationAssignmentHandler);

router.route("/:id").get(staffLocationAssignmentController.getStaffLocationAssignmentHandler).patch(staffLocationAssignmentController.updateStaffLocationAssignmentHandler).delete(staffLocationAssignmentController.deleteStaffLocationAssignmentHandler);

module.exports = router;

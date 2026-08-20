"use strict";
const router = require("express").Router();
const staffLocationAssignmentController = require("../controllers/staff-location-assignment.controller");
const { protect, requirePermission } = require("../middleware/auth");
const { generalLimiter } = require("../middleware/rateLimit");

router.use(generalLimiter);

router.use(generalLimiter, protect, requirePermission("manage_staff"));

router.route("/").get(staffLocationAssignmentController.getStaffLocationAssignmentsHandler).post(staffLocationAssignmentController.createStaffLocationAssignmentHandler);

router.route("/:id").get(staffLocationAssignmentController.getStaffLocationAssignmentHandler).patch(staffLocationAssignmentController.updateStaffLocationAssignmentHandler).delete(staffLocationAssignmentController.deleteStaffLocationAssignmentHandler);

module.exports = router;

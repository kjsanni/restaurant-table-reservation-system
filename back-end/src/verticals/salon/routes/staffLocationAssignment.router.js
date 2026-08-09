"use strict";
const router = require("express").Router();
const staffLocationAssignmentController = require("../controllers/staffLocationAssignment.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { generalLimiter } = require("../../../middleware/rateLimit");

router.use(generalLimiter);

router.use(protect, requireVertical("salon"), requirePermission("manage_staff"));

router.route("/").get(staffLocationAssignmentController.getStaffLocationAssignmentsHandler).post(staffLocationAssignmentController.createStaffLocationAssignmentHandler);

router.route("/:id").get(staffLocationAssignmentController.getStaffLocationAssignmentHandler).patch(staffLocationAssignmentController.updateStaffLocationAssignmentHandler).delete(staffLocationAssignmentController.deleteStaffLocationAssignmentHandler);

module.exports = router;

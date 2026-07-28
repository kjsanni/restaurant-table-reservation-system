"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const commissionController = require("../controllers/commission.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_commissions")),
    tryCatchHandler(commissionController.getAllCommissions)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_commissions")),
    tryCatchHandler(commissionController.createCommission)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_commissions")),
    tryCatchHandler(commissionController.getCommission)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_commissions")),
    tryCatchHandler(commissionController.updateCommission)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_commissions")),
    tryCatchHandler(commissionController.deleteCommission)
  )
  .all(httpMethodError);

router
  .route("/:id/mark-paid")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_commissions")),
    tryCatchHandler(commissionController.markCommissionPaid)
  );

router
  .route("/pending-total")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_commissions")),
    tryCatchHandler(commissionController.getPendingTotal)
  );

module.exports = router;

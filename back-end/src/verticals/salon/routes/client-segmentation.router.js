"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../../../middleware/httpMethodError");
const tryCatchHandler = require("../../../middleware/tryCatch");
const clientSegmentationController = require("../controllers/client-segmentation.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/segmentation")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(clientSegmentationController.getClientSegmentationHandler)
  )
  .all(httpMethodError);

router
  .route("/record-visit")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(clientSegmentationController.recordClientVisitHandler)
  )
  .all(httpMethodError);

router
  .route("/mark-no-show")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("edit_appointments")),
    tryCatchHandler(clientSegmentationController.markClientNoShowHandler)
  )
  .all(httpMethodError);

module.exports = router;

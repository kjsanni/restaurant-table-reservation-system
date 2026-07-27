"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const locationController = require("../controllers/location.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(locationController.getLocationsHandler)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(locationController.createLocationHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(locationController.getLocationHandler)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(locationController.updateLocationHandler)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_tenants")),
    tryCatchHandler(locationController.deleteLocationHandler)
  )
  .all(httpMethodError);

module.exports = router;

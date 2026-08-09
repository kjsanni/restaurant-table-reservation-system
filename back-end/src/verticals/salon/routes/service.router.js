"use strict";
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../../middleware/tryCatch");
const httpMethodError = require("../../../middleware/httpMethodError");
const serviceController = require("../controllers/service.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { generalLimiter } = require("../../../middleware/rateLimit");

router.use(generalLimiter);

router
  .route("/")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(serviceController.getAllServices)
  )
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(serviceController.createService)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_services")),
    tryCatchHandler(serviceController.getService)
  )
  .patch(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(serviceController.updateService)
  )
  .delete(
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(serviceController.deleteService)
  )
  .all(httpMethodError);

module.exports = router;

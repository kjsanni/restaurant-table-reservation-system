"use strict";
const express = require("express");
const router = express.Router();
const httpMethodError = require("../../../middleware/httpMethodError");
const tryCatchHandler = require("../../../middleware/tryCatch");
const galleryController = require("../controllers/gallery.controller");
const { protect, requirePermission } = require("../../../middleware/auth");
const { requireVertical } = require("../../../middleware/requireVertical");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");

router
  .route("/")
  .get(
    tenantLimiter,
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("view_appointments")),
    tryCatchHandler(galleryController.getGalleryImagesHandler)
  )
  .post(
    tenantWriteLimiter,
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(galleryController.createGalleryImageHandler)
  )
  .all(httpMethodError);

router
  .route("/:id")
  .put(
    tenantWriteLimiter,
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(galleryController.updateGalleryImageHandler)
  )
  .delete(
    tenantWriteLimiter,
    tryCatchHandler(protect),
    tryCatchHandler(requireVertical("salon")),
    tryCatchHandler(requirePermission("manage_services")),
    tryCatchHandler(galleryController.deleteGalleryImageHandler)
  )
  .all(httpMethodError);

module.exports = router;

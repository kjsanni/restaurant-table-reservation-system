const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const subProcessorController = require("../controllers/subProcessor.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(subProcessorController.listSubProcessorsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(subProcessorController.createSubProcessorHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(subProcessorController.updateSubProcessorHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(subProcessorController.deleteSubProcessorHandler))
  .all(httpMethodError);

module.exports = router;

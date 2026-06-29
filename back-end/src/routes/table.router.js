const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const tableController = require("../controllers/table.controller");
const { validateCsrfToken } = require("../middleware/csrf");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("manage_tables", tableController.getAllHandler))
  .post(...writeRoute("manage_tables", tableController.registerHandler))
  .all(httpMethodError);

router
  .route("/staff")
  .get(...protectedRoute("manage_tables", tableController.getWaitingStaffHandler))
  .all(httpMethodError);

router
  .route("/:tableId/staff")
  .post(...writeRoute("manage_tables", tableController.assignStaffHandler))
  .all(httpMethodError);

router
  .route("/:tableId/staff/:userId")
  .delete(...writeRoute("manage_tables", tableController.unassignStaffHandler))
  .all(httpMethodError);

router
  .route("/:tableId")
  .delete(...writeRoute("manage_tables", tableController.freeTableHandler))
  .all(httpMethodError);

router
  .route("/:id/block")
  .patch(...writeRoute("manage_tables", tableController.blockTableHandler))
  .all(httpMethodError);

router
  .route("/:id/unblock")
  .patch(...writeRoute("manage_tables", tableController.unblockTableHandler))
  .all(httpMethodError);

module.exports = router;

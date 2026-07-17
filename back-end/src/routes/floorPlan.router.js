const express = require("express");
const router = express.Router();
const httpMethodError = require("../middleware/httpMethodError");
const floorPlanController = require("../controllers/floorPlan.controller");
const { protectedRoute, writeRoute } = require("../utils/routeHelpers");

router
  .route("/")
  .get(...protectedRoute("manage_tables", floorPlanController.getHandler))
  .post(...writeRoute("manage_tables", floorPlanController.createHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .delete(...writeRoute("manage_tables", floorPlanController.deleteHandler))
  .all(httpMethodError);

module.exports = router;

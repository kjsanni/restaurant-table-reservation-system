const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const publicController = require("../controllers/public.controller");

router
  .route("/plans")
  .get(tryCatchHandler(publicController.listPublicPlansHandler))
  .all(httpMethodError);

router
  .route("/changelog")
  .get(tryCatchHandler(publicController.getChangelogHandler))
  .all(httpMethodError);

router
  .route("/events")
  .get(tryCatchHandler(publicController.listPublicEventsHandler))
  .all(httpMethodError);

router
  .route("/events/:id")
  .get(tryCatchHandler(publicController.getPublicEventHandler))
  .all(httpMethodError);

module.exports = router;

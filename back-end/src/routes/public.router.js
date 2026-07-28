const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../middleware/tryCatch");
const httpMethodError = require("../middleware/httpMethodError");
const publicController = require("../controllers/public.controller");

router
  .route("/plans")
  .get(tryCatchHandler(publicController.listPublicPlansHandler))
  .all(httpMethodError);

module.exports = router;

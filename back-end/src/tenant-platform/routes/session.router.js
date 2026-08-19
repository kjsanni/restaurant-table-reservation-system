const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const sessionController = require("../controllers/session.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(sessionController.listSessionsHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(sessionController.revokeSessionHandler))
  .all(httpMethodError);

router
  .route("/revoke-all")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(sessionController.revokeAllSessionsHandler))
  .all(httpMethodError);

module.exports = router;

const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const breakGlassController = require("../controllers/breakGlass.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/break-glass/request")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.requestBreakGlassHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/approve/:requestId")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.approveBreakGlassHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/deny/:requestId")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.denyBreakGlassHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/revoke/:requestId")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.revokeBreakGlassHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/requests")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.listBreakGlassRequestsHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/my-requests")
  .get(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.listMyBreakGlassRequestsHandler)
  )
  .all(httpMethodError);

router
  .route("/break-glass/expire")
  .post(
    tryCatchHandler(protect),
    tryCatchHandler(requireSuperAdmin),
    tryCatchHandler(breakGlassController.expireBreakGlassHandler)
  )
  .all(httpMethodError);

module.exports = router;

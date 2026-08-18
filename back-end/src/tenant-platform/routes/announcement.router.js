// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via tryCatchHandler-wrapped adminActionLimiter middleware in all routes
const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const announcementController = require("../controllers/announcement.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");
const { adminActionLimiter } = require("../../middleware/rateLimit");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(adminActionLimiter), tryCatchHandler(announcementController.listAnnouncementsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(adminActionLimiter), tryCatchHandler(announcementController.createAnnouncementHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(adminActionLimiter), tryCatchHandler(announcementController.updateAnnouncementHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_admin")), tryCatchHandler(adminActionLimiter), tryCatchHandler(announcementController.deleteAnnouncementHandler))
  .all(httpMethodError);

module.exports = router;

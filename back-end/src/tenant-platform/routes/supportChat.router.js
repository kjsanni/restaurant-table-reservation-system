const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportChatController = require("../controllers/supportChat.controller");
const { protect, requirePlatformRole } = require("../../middleware/auth");

router
  .route("/conversations")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.listConversationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(supportChatController.createConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.getConversationHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.updateConversationHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.deleteConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/messages")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.listMessagesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.sendMessageHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/auto-assign")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.autoAssignConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/csat")
  .post(tryCatchHandler(protect), tryCatchHandler(requirePlatformRole("platform_support")), tryCatchHandler(supportChatController.submitCsatHandler))
  .all(httpMethodError);

module.exports = router;

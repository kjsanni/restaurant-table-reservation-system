const express = require("express");
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
router.use(adminActionLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportChatController = require("../controllers/supportChat.controller");
const { protect, requireSupportAccess } = require("../../middleware/auth");

router
  .route("/conversations")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.listConversationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.createConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.getConversationHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.updateConversationHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.deleteConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/messages")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.listMessagesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.sendMessageHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/auto-assign")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.autoAssignConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/csat")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSupportAccess), tryCatchHandler(supportChatController.submitCsatHandler))
  .all(httpMethodError);

module.exports = router;

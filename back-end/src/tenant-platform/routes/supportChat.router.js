const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const supportChatController = require("../controllers/supportChat.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/conversations")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportChatController.listConversationsHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(supportChatController.createConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportChatController.getConversationHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportChatController.updateConversationHandler))
  .all(httpMethodError);

router
  .route("/conversations/:id/messages")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportChatController.listMessagesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(supportChatController.sendMessageHandler))
  .all(httpMethodError);

module.exports = router;

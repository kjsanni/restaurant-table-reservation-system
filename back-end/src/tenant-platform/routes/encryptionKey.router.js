const express = require("express");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const encryptionKeyController = require("../controllers/encryptionKey.controller");
const { protect, requireSuperAdmin } = require("../../middleware/auth");

router
  .route("/")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.listEncryptionKeysHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.createEncryptionKeyHandler))
  .all(httpMethodError);

router
  .route("/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.getEncryptionKeyHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.deleteEncryptionKeyHandler))
  .all(httpMethodError);

router
  .route("/:id/rotate")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.rotateEncryptionKeyHandler))
  .all(httpMethodError);

router
  .route("/:id/retire")
  .post(tryCatchHandler(protect), tryCatchHandler(requireSuperAdmin), tryCatchHandler(encryptionKeyController.retireEncryptionKeyHandler))
  .all(httpMethodError);

module.exports = router;

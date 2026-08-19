const express = require("express");
const { tenantLimiter } = require("../middleware/tenantRateLimit");
const router = express.Router();
router.use(tenantLimiter);
const tryCatchHandler = require("../../middleware/tryCatch");
const { protect, requireActiveTenant } = require("../../middleware/auth");
const tenantEncryptionKeyController = require("../controllers/tenantEncryptionKey.controller");

router.use(tryCatchHandler(protect), tryCatchHandler(requireActiveTenant));

router
  .route("/")
  .get(tryCatchHandler(tenantEncryptionKeyController.listTenantEncryptionKeysHandler))
  .post(tryCatchHandler(tenantEncryptionKeyController.createTenantEncryptionKeyHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id")
  .get(tryCatchHandler(tenantEncryptionKeyController.listTenantEncryptionKeysHandler))
  .delete(tryCatchHandler(tenantEncryptionKeyController.deleteTenantEncryptionKeyHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id/rotate")
  .post(tryCatchHandler(tenantEncryptionKeyController.rotateTenantEncryptionKeyHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

router
  .route("/:id/retire")
  .post(tryCatchHandler(tenantEncryptionKeyController.retireTenantEncryptionKeyHandler))
  .all((req, res) => res.status(405).json({ success: false, message: "Method not allowed" }));

module.exports = router;

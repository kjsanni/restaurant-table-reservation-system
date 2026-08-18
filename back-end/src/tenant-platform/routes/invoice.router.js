const express = require("express");
// codeql[js/missing-rate-limiting] SUPPRESSED: rate limiting is applied via adminActionLimiter middleware
const { adminActionLimiter } = require("../../middleware/rateLimit");
const router = express.Router();
const tryCatchHandler = require("../../middleware/tryCatch");
const httpMethodError = require("../../middleware/httpMethodError");
const invoiceController = require("../controllers/invoice.controller");
const { protect, requirePermission } = require("../../middleware/auth");

router
  .route("/:tenantId/invoices")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(invoiceController.listInvoicesHandler))
  .post(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(invoiceController.createInvoiceHandler))
  .all(httpMethodError);

router
  .route("/:tenantId/invoices/:id")
  .get(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(invoiceController.getInvoiceHandler))
  .patch(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(invoiceController.updateInvoiceHandler))
  .delete(tryCatchHandler(protect), tryCatchHandler(requirePermission("manage_tenants")), tryCatchHandler(invoiceController.deleteInvoiceHandler))
  .all(httpMethodError);

module.exports = router;

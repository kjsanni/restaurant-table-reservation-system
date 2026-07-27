const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");
const { Sentry } = require("../middleware/monitoring");
const tableRouter = require("../routes/table.router");
const reservationRouter = require("../routes/reservation.router");
const authRouter = require("../routes/auth.router");
const scheduleRouter = require("../routes/schedule.router");
const shiftRouter = require("../routes/shift.router");
const timeOffRouter = require("../routes/timeOff.router");
const floorPlanRouter = require("../routes/floorPlan.router");
const auditLogRouter = require("../routes/auditLog.router");
const rbacRouter = require("../routes/rbac.router");
const waitlistRouter = require("../routes/waitlist.router");
const paymentRouter = require("../routes/payment.router");
const reportRouter = require("../routes/report.router");
const customerRouter = require("../routes/customer.router");
const adminRouter = require("../routes/admin.router");
const customerPortalRouter = require("../routes/customer-portal.router");
const notificationRouter = require("../routes/notification.router");
const emailTemplateRouter = require("../routes/emailTemplate.router");
const webhookRouter = require("../routes/webhook.router");
const whatsappRouter = require("../routes/whatsapp.router");
const deliveryRouter = require("../routes/delivery.router");
const shaqexpressRouter = require("../routes/shaqexpress.router");
const legalRouter = require("../routes/legal.router");
const { setCsrfCookie, generateCsrfToken, CSRF_HEADER_NAME, CSRF_COOKIE_NAME, validateCsrfToken } = require("../middleware/csrf");
const { requestMetrics, getStats } = require("../middleware/monitoring");
const { requestLogger } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");
const tryCatchHandler = require("../middleware/tryCatch");
const { protect, requireSuperAdmin } = require("../middleware/auth");
const ipAllowlist = require("../middleware/ipAllowlist");

const superAdminProtect = (req, res, next) => {
  protect(req, res, () => {
    requireSuperAdmin(req, res, next);
  });
};

const adminMiddleware = (req, res, next) => {
  ipAllowlist(req, res, () => {
    superAdminProtect(req, res, next);
  });
};

const { authLimiter, generalLimiter, bulkOperationLimiter, adminActionLimiter, syncLimiter, webhookLimiter } = require("../middleware/rateLimit");
const { startNotificationWorker } = require("../queues/notification.queue");
const { startReportWorker } = require("../queues/report.queue");

const TENANT_MODE = process.env.TENANT_MODE === "enabled";
let resolveTenant = null;
let requireActiveTenant = null;
let tenantAdminRoutes = null;
let planRoutes = null;
let platformPaymentRoutes = null;
let usageRoutes = null;
let revenueRoutes = null;
let bulkActionRoutes = null;
let noteRoutes = null;
let trialRoutes = null;
let invoiceRoutes = null;
let billingEmailRoutes = null;
let statusTimelineRoutes = null;
let gracePeriodRoutes = null;
let whiteLabelRoutes = null;
let apiKeyRoutes = null;
let platformAuditRoutes = null;
let notificationRoutes = null;
let onboardingRoutes = null;
let legalAcceptanceRoutes = null;
let dsarRequestRoutes = null;
  let publicDsarRoutes = null;
  let benchmarkRoutes = null;
  let billingRoutes = null;
  let requireFeature = null;
  let requiresServiceMode = null;
  let supportTicketRoutes = null;
  let totpRoutes = null;
  let sessionRoutes = null;
  let incidentRoutes = null;
  let failedPaymentAlertRoutes = null;
  let backupRoutes = null;
  let deploymentRoutes = null;
  let securityRoutes = null;
  let complianceRoutes = null;
  let supportChatRoutes = null;
  let supportTemplateRoutes = null;
  let featureFlagRoutes = null;
  let financialManagementRoutes = null;
  let whistleblowerTipRoutes = null;
  let integrationAnalyticsRoutes = null;
  let impersonationRoutes = null;
  let salonAppointmentRoutes = null;
  let salonStationRoutes = null;
  let salonServiceRoutes = null;
  let salonServicePackageRoutes = null;
  let salonGiftCardRoutes = null;
  let salonReferralRoutes = null;
  let salonLocationRoutes = null;
  let salonInventoryRoutes = null;
  let salonExpensesRoutes = null;
  let salonPricingRulesRoutes = null;
  let apiLatencyRoutes = null;
  let cacheStatsRoutes = null;
  let verticalTemplateRoutes = null;
  let supportNoteRoutes = null;
  let supportAttachmentRoutes = null;
  let complianceRuleRoutes = null;
  let notificationTemplateRoutes = null;
  let announcementRoutes = null;
  let dataRetentionPolicyRoutes = null;
  let salonCustomerPortalRoutes = null;
  let salonDashboardRoutes = null;

if (TENANT_MODE) {
  ({ resolveTenant } = require("../tenant-platform/middleware/resolveTenant"));
  ({ requireActiveTenant } = require("../tenant-platform/middleware/tenantStatus"));
  ({ requiredFeature: requireFeature, requiresServiceMode } = require("../tenant-platform/middleware/featureGuard"));
  tenantAdminRoutes = require("../tenant-platform/routes/tenantAdmin.router");
  planRoutes = require("../tenant-platform/routes/plan.router");
  platformPaymentRoutes = require("../tenant-platform/routes/platformPayment.router");
  usageRoutes = require("../tenant-platform/routes/usage.router");
  revenueRoutes = require("../tenant-platform/routes/revenue.router");
  bulkActionRoutes = require("../tenant-platform/routes/bulkAction.router");
  noteRoutes = require("../tenant-platform/routes/note.router");
  trialRoutes = require("../tenant-platform/routes/trial.router");
  invoiceRoutes = require("../tenant-platform/routes/invoice.router");
  billingEmailRoutes = require("../tenant-platform/routes/billingEmail.router");
  statusTimelineRoutes = require("../tenant-platform/routes/statusTimeline.router");
  gracePeriodRoutes = require("../tenant-platform/routes/gracePeriod.router");
  whiteLabelRoutes = require("../tenant-platform/routes/whiteLabel.router");
  apiKeyRoutes = require("../tenant-platform/routes/apiKey.router");
  platformAuditRoutes = require("../tenant-platform/routes/platformAudit.router");
  notificationRoutes = require("../tenant-platform/routes/notification.router");
  onboardingRoutes = require("../tenant-platform/routes/onboarding.router");
  legalAcceptanceRoutes = require("../tenant-platform/routes/legalAcceptance.router");
  dsarRequestRoutes = require("../tenant-platform/routes/dsarRequest.router");
  publicDsarRoutes = require("../tenant-platform/routes/publicDsar.router");
  publicTenantRoutes = require("../tenant-platform/routes/publicTenant.router");
  benchmarkRoutes = require("../tenant-platform/routes/benchmark.router");
  billingRoutes = require("../tenant-platform/routes/billing.router");
  supportTicketRoutes = require("../tenant-platform/routes/supportTicket.router");
  totpRoutes = require("../tenant-platform/routes/totp.router");
  sessionRoutes = require("../tenant-platform/routes/session.router");
  incidentRoutes = require("../tenant-platform/routes/incident.router");
  failedPaymentAlertRoutes = require("../tenant-platform/routes/failedPaymentAlert.router");
  backupRoutes = require("../tenant-platform/routes/backup.router");
  deploymentRoutes = require("../tenant-platform/routes/deployment.router");
  securityRoutes = require("../tenant-platform/routes/security.router");
  complianceRoutes = require("../tenant-platform/routes/compliance.router");
  supportChatRoutes = require("../tenant-platform/routes/supportChat.router");
  supportTemplateRoutes = require("../tenant-platform/routes/supportTemplate.router");
  featureFlagRoutes = require("../tenant-platform/routes/featureFlag.router");
  financialManagementRoutes = require("../tenant-platform/routes/financialManagement.router");
  whistleblowerTipRoutes = require("../tenant-platform/routes/whistleblowerTip.router");
  integrationAnalyticsRoutes = require("../tenant-platform/routes/integrationAnalytics.router");
  impersonationRoutes = require("../tenant-platform/routes/impersonation.router");
  advancedAnalyticsRoutes = require("../tenant-platform/routes/advancedAnalytics.router");
  maintenanceRoutes = require("../tenant-platform/routes/maintenance.router");
  trustSafetyRoutes = require("../tenant-platform/routes/trustSafety.router");
  monitoringRoutes = require("../tenant-platform/routes/monitoring.router");
  verticalAnalyticsRoutes = require("../tenant-platform/routes/verticalAnalytics.router");
  dataRetentionRoutes = require("../tenant-platform/routes/dataRetention.router");
  incidentRoutes = require("../tenant-platform/routes/incident.router");
  suspiciousActivityRoutes = require("../tenant-platform/routes/suspiciousActivity.router");
  subProcessorRoutes = require("../tenant-platform/routes/subProcessor.router");
  debugRoutes = require("../tenant-platform/routes/debug.router");
  migrationRoutes = require("../tenant-platform/routes/migration.router");
  postmortemRoutes = require("../tenant-platform/routes/postmortem.router");
  apiLatencyRoutes = require("../tenant-platform/routes/apiLatency.router");
  cacheStatsRoutes = require("../tenant-platform/routes/cacheStats.router");
  verticalTemplateRoutes = require("../tenant-platform/routes/verticalTemplate.router");
  supportNoteRoutes = require("../tenant-platform/routes/supportNote.router");
  supportAttachmentRoutes = require("../tenant-platform/routes/supportAttachment.router");
  complianceRuleRoutes = require("../tenant-platform/routes/complianceRule.router");
  notificationTemplateRoutes = require("../tenant-platform/routes/notificationTemplate.router");
  announcementRoutes = require("../tenant-platform/routes/announcement.router");
  dataRetentionPolicyRoutes = require("../tenant-platform/routes/dataRetentionPolicy.router");
  subProcessorRoutes = require("../tenant-platform/routes/subProcessor.router");
  platformReportRoutes = require("../tenant-platform/routes/platformReport.router");
  reconciliationRoutes = require("../tenant-platform/routes/reconciliation.router");
  ({ requireVertical } = require("../middleware/requireVertical"));
  salonAppointmentRoutes = require("../verticals/salon/routes/appointment.router");
  salonStationRoutes = require("../verticals/salon/routes/station.router");
  salonServiceRoutes = require("../verticals/salon/routes/service.router");
  salonServicePackageRoutes = require("../verticals/salon/routes/servicePackage.router");
  salonGiftCardRoutes = require("../verticals/salon/routes/giftCard.router");
  salonReferralRoutes = require("../verticals/salon/routes/referral.router");
  salonLocationRoutes = require("../verticals/salon/routes/location.router");
  salonInventoryRoutes = require("../verticals/salon/routes/inventoryItem.router");
  salonExpensesRoutes = require("../verticals/salon/routes/expense.router");
  salonPricingRulesRoutes = require("../verticals/salon/routes/pricingRule.router");
  salonCustomerPortalRoutes = require("../routes/salon-customer-portal.router");
  salonReportsRoutes = require("../routes/salon-reports.router");
  salonRecurringAppointmentRoutes = require("../verticals/salon/routes/recurring-appointment.router");
  salonClientSegmentationRoutes = require("../verticals/salon/routes/client-segmentation.router");
  salonStaffRoutes = require("../verticals/salon/routes/staff.router");
  salonMarketingCampaignRoutes = require("../verticals/salon/routes/marketing-campaign.router");
  salonGalleryRoutes = require("../verticals/salon/routes/gallery.router");
  salonDashboardRoutes = require("../routes/salon-dashboard.router");
}

const requestTimeout = (timeout = 15000) => {
  return (req, res, next) => {
    res.setTimeout(timeout, () => {
      res.status(444).json({
        success: false,
        message: "Request timeout",
      });
    });
    next();
  };
};

const createServer = () => {
  const app = express();
  const server = require("http").createServer(app);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  getCurrentSecret();

  const corsOrigins = process.env.CORS_ORIGINS?.split(",").filter(o => o.trim());
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : ["http://localhost:8080"];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
  });

  app.set("io", io);

  if (TENANT_MODE) {
    const { runTenantCron } = require("../tenant-platform/utils/tenantCron");
    runTenantCron();
    setInterval(runTenantCron, 6 * 60 * 60 * 1000);

    const { runSalonCron } = require("../verticals/salon/utils/salonCron");
    runSalonCron().catch((err) => console.error("[SalonCron] startup error:", err.message));
    setInterval(() => runSalonCron().catch((err) => console.error("[SalonCron] error:", err.message)), 60 * 60 * 1000);
  }

  const workers = [];
  try {
    const nw = startNotificationWorker();
    const rw = startReportWorker();
    if (nw) workers.push(nw);
    if (rw) workers.push(rw);
  } catch (err) {
    console.warn("BullMQ workers not started:", err.message);
  }

  const shutdownWorkers = async () => {
    await Promise.all(workers.map((w) => w.close().catch(() => {})));
  };
  process.once("SIGTERM", shutdownWorkers);
  process.once("SIGINT", shutdownWorkers);

  app.use(cookieParser());
  app.use(requestLogger);
  app.use(requestMetrics);
  app.use(setCsrfCookie);
  app.use(requestTimeout(15000));

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));
  app.use(express.json({ limit: "5kb" }));
  app.use(helmet({ crossOriginResourcePolicy: false, hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false }));
  app.use(cspHeaders);
  app.use(require("../middleware/sanitize").sanitize);
  app.use(require("../middleware/apiLatency"));

  app.get("/api/v1/csrf-token", (req, res) => {
    const token = req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : false,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    res.json({ success: true, token });
  });

  app.get("/api/v1/health", (req, res) => {
    res.json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
  });

  if (TENANT_MODE) {
    app.use(tryCatchHandler(resolveTenant));
    app.use(tryCatchHandler(requireActiveTenant));
  }

  app.use("/api/v1", generalLimiter, require("../routes"));
  app.use("/api/v1/tables", logAction, validateCsrfToken, TENANT_MODE ? requireFeature("table_management") : null, tableRouter);
  app.use("/api/v1/reservations", logAction, validateCsrfToken, TENANT_MODE ? requiresServiceMode("dine_in") : null, reservationRouter);
  app.use("/api/v1/auth", validateCsrfToken, authRouter);
  app.use("/api/v1/schedule", logAction, validateCsrfToken, TENANT_MODE ? requireFeature("staff_scheduling") : null, scheduleRouter);
  app.use("/api/v1/shifts", logAction, validateCsrfToken, TENANT_MODE ? requireFeature("staff_scheduling") : null, shiftRouter);
  app.use("/api/v1/time-offs", logAction, validateCsrfToken, TENANT_MODE ? requireFeature("staff_scheduling") : null, timeOffRouter);
  app.use("/api/v1/floor-plans", logAction, validateCsrfToken, TENANT_MODE ? requireFeature("table_management") : null, floorPlanRouter);
  app.use("/api/v1/audit-logs", auditLogRouter);
  app.use("/api/v1/rbac", logAction, validateCsrfToken, rbacRouter);
  app.use("/api/v1/waitlist", logAction, validateCsrfToken, bulkOperationLimiter, TENANT_MODE ? [requireFeature("waitlist"), requiresServiceMode("dine_in")] : null, waitlistRouter);
  app.use("/api/v1/payments", logAction, validateCsrfToken, paymentRouter);
  app.use("/api/v1/reports", logAction, validateCsrfToken, reportRouter);
  app.use("/api/v1/menu", logAction, validateCsrfToken, require("../routes/menu.router"));
  app.use("/api/v1/orders", logAction, validateCsrfToken, require("../routes/order.router"));
  app.use("/api/v1/promotions", logAction, validateCsrfToken, require("../routes/promotion.router"));
  app.use("/api/v1/customers", logAction, validateCsrfToken, customerRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminMiddleware, adminRouter);
  if (TENANT_MODE) {
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, trialRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, invoiceRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, statusTimelineRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, gracePeriodRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, whiteLabelRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, apiKeyRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, onboardingRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, legalAcceptanceRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, dsarRequestRoutes);
    app.use("/api/v1/admin/benchmarks", logAction, validateCsrfToken, adminMiddleware, benchmarkRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, noteRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, adminMiddleware, tenantAdminRoutes);
    app.use("/api/v1/admin/plans", logAction, validateCsrfToken, adminMiddleware, planRoutes);
    app.use("/api/v1/admin/payments", logAction, validateCsrfToken, adminMiddleware, platformPaymentRoutes);
    app.use("/api/v1/admin/usage", logAction, validateCsrfToken, adminMiddleware, usageRoutes);
    app.use("/api/v1/admin/revenue", logAction, validateCsrfToken, adminMiddleware, revenueRoutes);
    app.use("/api/v1/admin/bulk", logAction, validateCsrfToken, adminMiddleware, bulkActionRoutes);
    app.use("/api/v1/admin/billing-emails", logAction, validateCsrfToken, adminMiddleware, billingEmailRoutes);
    app.use("/api/v1/admin/audit", logAction, validateCsrfToken, adminMiddleware, platformAuditRoutes);
    app.use("/api/v1/admin/notifications", logAction, validateCsrfToken, adminMiddleware, notificationRoutes);
    app.use("/api/v1/admin/support-tickets", logAction, validateCsrfToken, adminMiddleware, supportTicketRoutes);
    app.use("/api/v1/admin/totp", logAction, validateCsrfToken, adminMiddleware, totpRoutes);
    app.use("/api/v1/admin/sessions", logAction, validateCsrfToken, adminMiddleware, sessionRoutes);
    app.use("/api/v1/admin/incidents", logAction, validateCsrfToken, adminMiddleware, incidentRoutes);
    app.use("/api/v1/admin/payment-alerts", logAction, validateCsrfToken, adminMiddleware, failedPaymentAlertRoutes);
    app.use("/api/v1/admin/backups", logAction, validateCsrfToken, adminMiddleware, backupRoutes);
    app.use("/api/v1/admin/deployment", logAction, validateCsrfToken, adminMiddleware, deploymentRoutes);
    app.use("/api/v1/admin/security", logAction, validateCsrfToken, adminMiddleware, securityRoutes);
    app.use("/api/v1/admin/compliance", logAction, validateCsrfToken, adminMiddleware, complianceRoutes);
    app.use("/api/v1/admin/support-chat", logAction, validateCsrfToken, adminMiddleware, supportChatRoutes);
    app.use("/api/v1/admin/support-notes", logAction, validateCsrfToken, adminMiddleware, supportNoteRoutes);
    app.use("/api/v1/admin/support-attachments", logAction, validateCsrfToken, adminMiddleware, supportAttachmentRoutes);
    app.use("/api/v1/admin/compliance-rules", logAction, validateCsrfToken, adminMiddleware, complianceRuleRoutes);
    app.use("/api/v1/admin/notification-templates", logAction, validateCsrfToken, adminMiddleware, notificationTemplateRoutes);
    app.use("/api/v1/admin/announcements", logAction, validateCsrfToken, adminMiddleware, announcementRoutes);
    app.use("/api/v1/admin/data-retention/policies", logAction, validateCsrfToken, adminMiddleware, dataRetentionPolicyRoutes);
    app.use("/api/v1/admin/support-templates", logAction, validateCsrfToken, adminMiddleware, supportTemplateRoutes);
    app.use("/api/v1/admin/feature-flags", logAction, validateCsrfToken, adminMiddleware, featureFlagRoutes);
    app.use("/api/v1/admin/financial", logAction, validateCsrfToken, adminMiddleware, financialManagementRoutes);
    app.use("/api/v1/admin/whistleblower", logAction, validateCsrfToken, adminMiddleware, whistleblowerTipRoutes);
    app.use("/api/v1/admin/integrations", logAction, validateCsrfToken, adminMiddleware, integrationAnalyticsRoutes);
    app.use("/api/v1/admin/impersonation", logAction, validateCsrfToken, adminMiddleware, impersonationRoutes);
    app.use("/api/v1/admin/analytics", logAction, validateCsrfToken, adminMiddleware, advancedAnalyticsRoutes);
    app.use("/api/v1/admin/maintenance", logAction, validateCsrfToken, adminMiddleware, maintenanceRoutes);
    app.use("/api/v1/admin/trust-safety", logAction, validateCsrfToken, adminMiddleware, trustSafetyRoutes);
    app.use("/api/v1/admin/monitoring", logAction, validateCsrfToken, adminMiddleware, monitoringRoutes);
    app.use("/api/v1/admin/monitoring/api-latency", logAction, validateCsrfToken, adminMiddleware, apiLatencyRoutes);
    app.use("/api/v1/admin/monitoring/cache", logAction, validateCsrfToken, adminMiddleware, cacheStatsRoutes);
    app.use("/api/v1/admin/vertical-analytics", logAction, validateCsrfToken, adminMiddleware, verticalAnalyticsRoutes);
    app.use("/api/v1/admin/vertical-templates", logAction, validateCsrfToken, adminMiddleware, verticalTemplateRoutes);
    app.use("/api/v1/admin/data-retention", logAction, validateCsrfToken, adminMiddleware, dataRetentionRoutes);
    app.use("/api/v1/admin/incidents", logAction, validateCsrfToken, adminMiddleware, incidentRoutes);
    app.use("/api/v1/admin/suspicious-activity", logAction, validateCsrfToken, adminMiddleware, suspiciousActivityRoutes);
    app.use("/api/v1/admin/sub-processors", logAction, validateCsrfToken, adminMiddleware, subProcessorRoutes);
    app.use("/api/v1/admin/platform-reports", logAction, validateCsrfToken, adminMiddleware, platformReportRoutes);
    app.use("/api/v1/admin/reconciliation", logAction, validateCsrfToken, adminMiddleware, reconciliationRoutes);
    app.use("/api/v1/admin/debug", logAction, validateCsrfToken, adminMiddleware, debugRoutes);
    app.use("/api/v1/admin/migration", logAction, validateCsrfToken, adminMiddleware, migrationRoutes);
    app.use("/api/v1/admin/postmortems", logAction, validateCsrfToken, adminMiddleware, postmortemRoutes);
    app.use("/api/v1/billing", logAction, validateCsrfToken, billingRoutes);
    app.use("/api/v1/salon/appointments", logAction, validateCsrfToken, salonAppointmentRoutes);
    app.use("/api/v1/salon/stations", logAction, validateCsrfToken, salonStationRoutes);
    app.use("/api/v1/salon/services", logAction, validateCsrfToken, salonServiceRoutes);
    app.use("/api/v1/salon/packages", logAction, validateCsrfToken, salonServicePackageRoutes);
    app.use("/api/v1/salon/gift-cards", logAction, validateCsrfToken, salonGiftCardRoutes);
    app.use("/api/v1/salon/referrals", logAction, validateCsrfToken, salonReferralRoutes);
    app.use("/api/v1/salon/locations", logAction, validateCsrfToken, salonLocationRoutes);
    app.use("/api/v1/salon/inventory", logAction, validateCsrfToken, salonInventoryRoutes);
    app.use("/api/v1/salon/expenses", logAction, validateCsrfToken, salonExpensesRoutes);
    app.use("/api/v1/salon/pricing", logAction, validateCsrfToken, salonPricingRulesRoutes);
    app.use("/api/v1/salon/customer-portal", logAction, validateCsrfToken, salonCustomerPortalRoutes);
    app.use("/api/v1/salon/reports", logAction, validateCsrfToken, salonReportsRoutes);
    app.use("/api/v1/salon/recurring-appointments", logAction, validateCsrfToken, salonRecurringAppointmentRoutes);
    app.use("/api/v1/salon/client-segmentation", logAction, validateCsrfToken, salonClientSegmentationRoutes);
    app.use("/api/v1/salon/marketing-campaigns", logAction, validateCsrfToken, salonMarketingCampaignRoutes);
    app.use("/api/v1/salon/gallery", logAction, validateCsrfToken, salonGalleryRoutes);
    app.use("/api/v1/salon/dashboard", logAction, validateCsrfToken, salonDashboardRoutes);
    app.use("/api/v1/salon/staff", logAction, validateCsrfToken, salonStaffRoutes);
  }
  app.use("/api/v1/customer-portal", logAction, validateCsrfToken, customerPortalRouter);
  app.use("/api/v1/notifications", logAction, validateCsrfToken, notificationRouter);
  app.use("/api/v1/email-templates", logAction, validateCsrfToken, emailTemplateRouter);
  app.use("/api/v1/webhooks", logAction, webhookLimiter, webhookRouter);
  app.use("/api/v1/whatsapp", logAction, generalLimiter, whatsappRouter);
  app.use("/api/v1/deliveries", logAction, validateCsrfToken, TENANT_MODE ? requiresServiceMode("delivery") : null, deliveryRouter);
  app.use("/api/v1/webhooks/shaqexpress", logAction, webhookLimiter, shaqexpressRouter);
  app.use("/api/v1/sync", logAction, syncLimiter, require("../routes/sync.router"));
  app.use("/api/v1/legal", legalRouter);
  if (TENANT_MODE && publicDsarRoutes) {
    app.use("/api/v1/public/dsar-request", publicDsarRoutes);
  }
  if (TENANT_MODE && publicTenantRoutes) {
    app.use("/api/v1/public/tenants", publicTenantRoutes);
  }
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }
  app.get("/api/v1/stats", tryCatchHandler(protect), (req, res, next) => {
    res.json({ success: true, stats: getStats() });
  });
  app.use(notFound);
  app.use(errorHandler);
  return { app, server, io };
};

module.exports = createServer;
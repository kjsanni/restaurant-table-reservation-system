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
const { protect } = require("../middleware/auth");
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
  benchmarkRoutes = require("../tenant-platform/routes/benchmark.router");
  billingRoutes = require("../tenant-platform/routes/billing.router");
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
  app.use("/api/v1/floor-plans", logAction, validateCsrfToken, floorPlanRouter);
  app.use("/api/v1/audit-logs", auditLogRouter);
  app.use("/api/v1/rbac", logAction, validateCsrfToken, rbacRouter);
  app.use("/api/v1/waitlist", logAction, validateCsrfToken, bulkOperationLimiter, TENANT_MODE ? [requireFeature("waitlist"), requiresServiceMode("dine_in")] : null, waitlistRouter);
  app.use("/api/v1/payments", logAction, validateCsrfToken, paymentRouter);
  app.use("/api/v1/reports", logAction, validateCsrfToken, reportRouter);
  app.use("/api/v1/menu", logAction, validateCsrfToken, require("../routes/menu.router"));
  app.use("/api/v1/orders", logAction, validateCsrfToken, require("../routes/order.router"));
  app.use("/api/v1/promotions", logAction, validateCsrfToken, require("../routes/promotion.router"));
  app.use("/api/v1/customers", logAction, validateCsrfToken, customerRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminRouter);
  if (TENANT_MODE) {
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, trialRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, invoiceRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, statusTimelineRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, gracePeriodRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, whiteLabelRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, apiKeyRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, onboardingRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, legalAcceptanceRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, dsarRequestRoutes);
    app.use("/api/v1/admin/benchmarks", logAction, validateCsrfToken, benchmarkRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, noteRoutes);
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, tenantAdminRoutes);
    app.use("/api/v1/admin/plans", logAction, validateCsrfToken, planRoutes);
    app.use("/api/v1/admin/payments", logAction, validateCsrfToken, platformPaymentRoutes);
    app.use("/api/v1/admin/usage", logAction, validateCsrfToken, usageRoutes);
    app.use("/api/v1/admin/revenue", logAction, validateCsrfToken, revenueRoutes);
    app.use("/api/v1/admin/bulk", logAction, validateCsrfToken, bulkActionRoutes);
    app.use("/api/v1/admin/billing-emails", logAction, validateCsrfToken, billingEmailRoutes);
    app.use("/api/v1/admin/audit", logAction, validateCsrfToken, platformAuditRoutes);
    app.use("/api/v1/admin/notifications", logAction, validateCsrfToken, notificationRoutes);
    app.use("/api/v1/billing", logAction, validateCsrfToken, billingRoutes);
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
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
const { setCsrfCookie, CSRF_HEADER_NAME, CSRF_COOKIE_NAME, validateCsrfToken } = require("../middleware/csrf");
const { requestMetrics, getStats } = require("../middleware/monitoring");
const { requestLogger } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");
const tryCatchHandler = require("../middleware/tryCatch");
const { protect } = require("../middleware/auth");
const { authLimiter, generalLimiter, bulkOperationLimiter, adminActionLimiter } = require("../middleware/rateLimit");
const { startNotificationWorker } = require("../queues/notification.queue");
const { startReportWorker } = require("../queues/report.queue");

const TENANT_MODE = process.env.TENANT_MODE === "enabled";
let resolveTenant = null;
let requireActiveTenant = null;
let tenantAdminRoutes = null;
let billingRoutes = null;

if (TENANT_MODE) {
  ({ resolveTenant } = require("../tenant-platform/middleware/resolveTenant"));
  ({ requireActiveTenant } = require("../tenant-platform/middleware/tenantStatus"));
  tenantAdminRoutes = require("../tenant-platform/routes/tenantAdmin.router");
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
  app.use("/api/v1/tables", logAction, validateCsrfToken, tableRouter);
  app.use("/api/v1/reservations", logAction, validateCsrfToken, reservationRouter);
  app.use("/api/v1/auth", authLimiter, validateCsrfToken, authRouter);
  app.use("/api/v1/schedule", logAction, validateCsrfToken, scheduleRouter);
  app.use("/api/v1/shifts", logAction, validateCsrfToken, shiftRouter);
  app.use("/api/v1/time-offs", logAction, validateCsrfToken, timeOffRouter);
  app.use("/api/v1/floor-plans", logAction, validateCsrfToken, floorPlanRouter);
  app.use("/api/v1/audit-logs", auditLogRouter);
  app.use("/api/v1/rbac", logAction, validateCsrfToken, rbacRouter);
  app.use("/api/v1/waitlist", logAction, validateCsrfToken, bulkOperationLimiter, waitlistRouter);
  app.use("/api/v1/payments", logAction, validateCsrfToken, paymentRouter);
  app.use("/api/v1/reports", logAction, validateCsrfToken, reportRouter);
  app.use("/api/v1/customers", logAction, validateCsrfToken, customerRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminRouter);
  if (TENANT_MODE) {
    app.use("/api/v1/admin/tenants", logAction, validateCsrfToken, tenantAdminRoutes);
    app.use("/api/v1/billing", logAction, billingRoutes);
  }
  app.use("/api/v1/customer-portal", logAction, validateCsrfToken, customerPortalRouter);
  app.use("/api/v1/notifications", logAction, validateCsrfToken, notificationRouter);
  app.use("/api/v1/email-templates", logAction, validateCsrfToken, emailTemplateRouter);
  app.use("/api/v1/webhooks", logAction, webhookRouter);
  app.use("/api/v1/sync", logAction, require("../routes/sync.router"));
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
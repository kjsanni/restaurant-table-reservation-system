const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");
const { Sentry } = require("../middleware/monitoring");
const authRouter = require("../routes/auth.router");
const passwordResetRouter = require("../routes/passwordReset.router");
const emailVerificationRouter = require("../routes/emailVerification.router");
const auditLogRouter = require("../routes/auditLog.router");
const rbacRouter = require("../routes/rbac.router");
const adminRouter = require("../routes/admin.router");
const notificationRouter = require("../routes/notification.router");
const emailTemplateRouter = require("../routes/emailTemplate.router");
const webhookRouter = require("../routes/webhook.router");
const shaqexpressRouter = require("../routes/shaqexpress.router");
const legalRouter = require("../routes/legal.router");
const publicRouter = require("../routes/public.router");
const statusRouter = require("../routes/status.router");
const docsRouter = require("../routes/docs.router");
const { setCsrfCookie, generateCsrfToken, CSRF_COOKIE_NAME, validateCsrfToken } = require("../middleware/csrf");
const { requestMetrics, getStats } = require("../middleware/monitoring");
  const { requestLogger, logStream } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");
const tryCatchHandler = require("../middleware/tryCatch");
const { protect, requireSuperAdmin } = require("../middleware/auth");
const ipAllowlist = require("../middleware/ipAllowlist");
const { authLimiter, generalLimiter, adminActionLimiter, syncLimiter, webhookLimiter } = require("../middleware/rateLimit");
const { startNotificationWorker } = require("../queues/notification.queue");
const { startReportWorker } = require("../queues/report.queue");
const { startBackupWorker } = require("../queues/backup.queue");
  const { client: redisClient } = require("./cache");
  const { checkQueueDepths } = require("../queues/queue");
const { resolveTenant } = require("../tenant-platform/middleware/resolveTenant");
const { requireActiveTenant } = require("../tenant-platform/middleware/tenantStatus");
const { loadModules } = require("../tenant-platform/modules/module.loader");
const erpnextAccountingRouter = require("../integrations/erpnext/proxies/accounting.proxy");
const erpnextInventoryRouter = require("../integrations/erpnext/proxies/inventory.proxy");
const erpnextHrRouter = require("../integrations/erpnext/proxies/hr.proxy");
const erpnextCrmRouter = require("../integrations/erpnext/proxies/crm.proxy");
const erpnextManufacturingRouter = require("../integrations/erpnext/proxies/manufacturing.proxy");
const erpnextOnboardingRouter = require("../integrations/erpnext/onboarding/onboarding");
const erpnextAdminRouter = require("../integrations/erpnext/admin/admin.router");

const { adminMiddleware } = require("../middleware/adminMiddleware");

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

  const corsOrigins = process.env.CORS_ORIGINS?.split(",").filter((o) => o.trim());
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : ["http://localhost:8080"];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth && socket.handshake.auth.token) || (socket.handshake.query && socket.handshake.query.token);
      if (!token) {
        return next(new Error("Authentication error: no token provided"));
      }
      const decoded = require("../services/authService").verifyToken(token);
      const user = await require("../DAOs/auth.dao").findUserById(decoded.userId);
      if (!user) {
        return next(new Error("Authentication error: user not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id, "user:", (socket.user && socket.user.id) || "anonymous");
  });

  app.set("io", io);

  const { runTenantCron } = require("../tenant-platform/utils/tenantCron");
  runTenantCron();
  const tenantCronInterval = setInterval(runTenantCron, 6 * 60 * 60 * 1000).unref();

  const { runSalonCron } = require("../verticals/salon/utils/salonCron");
  runSalonCron().catch((err) => console.error("[SalonCron] startup error:", err.message));
  const salonCronInterval = setInterval(() => runSalonCron().catch((err) => console.error("[SalonCron] error:", err.message)), 60 * 60 * 1000).unref();

  const { runBackupCron } = require("../tenant-platform/utils/backupCron");
  runBackupCron();
  const backupCronInterval = setInterval(runBackupCron, 60 * 60 * 1000).unref();

  const { runScheduledReportsCron } = require("../tenant-platform/utils/scheduledReports.cron");
  runScheduledReportsCron().catch((err) => console.error("[ScheduledReportsCron] startup error:", err.message));
  const scheduledReportsCronInterval = setInterval(() => runScheduledReportsCron().catch((err) => console.error("[ScheduledReportsCron] error:", err.message)), 60 * 60 * 1000).unref();

  const workers = [];
  try {
    const nw = startNotificationWorker();
    const rw = startReportWorker();
    const bw = startBackupWorker();
    if (nw) workers.push(nw);
    if (rw) workers.push(rw);
    if (bw) workers.push(bw);
  } catch (err) {
    console.warn("BullMQ workers not started:", err.message);
  }

  const shutdownWorkers = async () => {
    await Promise.all(workers.map((w) => w.close().catch(() => {})));
    clearInterval(tenantCronInterval);
    clearInterval(salonCronInterval);
    clearInterval(backupCronInterval);
    if (io) io.close();
    if (logStream && typeof logStream.end === "function") {
      logStream.end();
    }
    try {
      await require("../db/models").sequelize.close();
    } catch (err) {
      console.error("[shutdown] DB close error:", err.message);
    }
    if (redisClient && redisClient.isReady) {
      try {
        await redisClient.quit();
      } catch (err) {
        console.error("[shutdown] Redis close error:", err.message);
      }
    }
    server.close(() => {
      console.log("[shutdown] Server closed");
      process.exit(0);
    });
  };
  process.once("SIGTERM", shutdownWorkers);
  process.once("SIGINT", shutdownWorkers);

  app.use(cookieParser());
  app.use(requestLogger);
  app.use(requestMetrics);
  app.use(setCsrfCookie);
  app.use(requestTimeout(15000));

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "5kb" }));
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      hsts: process.env.NODE_ENV === "production" ? { maxAge: 365 * 24 * 60 * 60, includeSubDomains: true, preload: true } : false,
    })
  );
  app.use(cspHeaders);
  app.use(require("../middleware/sanitize").sanitize);
  app.use(require("../middleware/apiLatency"));

  app.get("/api/v1/csrf-token", (req, res) => {
    const token = req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      res.cookie(CSRF_COOKIE_NAME, token, {
        // nosemgrep: javascript.lang.security.audit.cookie-http-only-disabled - XSRF-TOKEN cookie must be readable by frontend JS for double-submit CSRF pattern
        httpOnly: false, // guardrails-disable-line - XSRF-TOKEN cookie must be readable by frontend JS for double-submit CSRF pattern
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "lax" : false,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    res.json({ success: true, token });
  });

  app.get("/api/v1/health", tryCatchHandler(async (req, res) => {
    const queueAlerts = await checkQueueDepths();
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      queueAlerts: queueAlerts.length ? queueAlerts : undefined,
    });
  }));

  app.use(tryCatchHandler(resolveTenant));
  app.use(tryCatchHandler(requireActiveTenant));

  app.use("/api/v1", generalLimiter, require("../routes"));
  app.use("/api/v1/auth", validateCsrfToken, authLimiter, authRouter);
  app.use("/api/v1/auth", validateCsrfToken, authLimiter, passwordResetRouter);
  app.use("/api/v1/auth", validateCsrfToken, authLimiter, emailVerificationRouter);
  app.use("/api/v1/audit-logs", generalLimiter, auditLogRouter);
  app.use("/api/v1/rbac", generalLimiter, logAction, validateCsrfToken, rbacRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminMiddleware, adminRouter);
  app.use("/api/v1/public", publicRouter);
  app.use("/api/v1/public/status", statusRouter);
  app.use("/api/v1/docs", docsRouter);
  loadModules(app);
  app.use(
    "/api/v1/erpnext",
    logAction,
    validateCsrfToken,
    generalLimiter,
    erpnextAccountingRouter,
    erpnextInventoryRouter,
    erpnextHrRouter,
    erpnextCrmRouter,
    erpnextManufacturingRouter,
    erpnextOnboardingRouter
  );
  app.use(
    "/api/v1/admin/erpnext",
    logAction,
    validateCsrfToken,
    adminActionLimiter,
    adminMiddleware,
    erpnextAdminRouter
  );
  app.use("/api/v1/notifications", generalLimiter, logAction, validateCsrfToken, notificationRouter);
  app.use("/api/v1/email-templates", generalLimiter, logAction, validateCsrfToken, emailTemplateRouter);
  app.use("/api/v1/webhooks", logAction, webhookLimiter, webhookRouter);
  app.use("/api/v1/webhooks/shaqexpress", logAction, webhookLimiter, shaqexpressRouter);
  app.use("/api/v1/sync", generalLimiter, logAction, syncLimiter, require("../routes/sync.router"));
  app.use("/api/v1/legal", generalLimiter, legalRouter);
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.expressErrorHandler());
  }
  app.get("/api/v1/stats", generalLimiter, tryCatchHandler(protect), (req, res, next) => {
    res.json({ success: true, stats: getStats() });
  });
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nSitemap: https://vibespotgh.com/sitemap.xml\n");
  });
  app.use(notFound);
  app.use(errorHandler);
  return { app, server, io };
};

module.exports = createServer;

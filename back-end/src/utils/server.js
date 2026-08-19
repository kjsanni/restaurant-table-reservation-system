const express = require("express");
const crypto = require("crypto");
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
const openapiSpec = require("../middleware/openapi");
const { versioningHeaders } = require("../middleware/deprecation");
const { setCsrfCookie, generateCsrfToken, CSRF_COOKIE_NAME, validateCsrfToken } = require("../middleware/csrf");
const { requestMetrics, requestTiming } = require("../middleware/monitoring");
const { requestLogger, logStream } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");
const tryCatchHandler = require("../middleware/tryCatch");
const { protect, _requireSuperAdmin } = require("../middleware/auth");
const { authLimiter, generalLimiter, adminActionLimiter, syncLimiter, webhookLimiter } = require("../middleware/rateLimit");
const { startNotificationWorker } = require("../queues/notification.queue");
const { startReportWorker } = require("../queues/report.queue");
const { startBackupWorker } = require("../queues/backup.queue");
const { startProvisioningWorker } = require("../queues/provisioning.queue");
const { startWalletPassSigningWorker, closeWalletPassSigningWorker } = require("../queues/walletPass.queue");
const walletPassAdminRouter = require("../routes/walletPassAdmin.router");
const { client: redisClient, getConnectionStatus } = require("./cache");
const { checkQueueDepths } = require("../queues/queue");
const { resolveTenant } = require("../tenant-platform/middleware/resolveTenant");
const { requireActiveTenant } = require("../tenant-platform/middleware/tenantStatus");
const { loadModules } = require("../tenant-platform/modules/module.loader");
const erpnextAccountingRouter = require("../integrations/erpnext/proxies/accounting.proxy");
const erpnextInventoryRouter = require("../integrations/erpnext/proxies/inventory.proxy");
const erpnextHrRouter = require("../integrations/erpnext/proxies/hr.proxy");
const erpnextCrmRouter = require("../integrations/erpnext/proxies/crm.proxy");
const erpnextManufacturingRouter = require("../integrations/erpnext/proxies/manufacturing.proxy");
const erpnextReportsRouter = require("../integrations/erpnext/proxies/reports.proxy");
const erpnextPosRouter = require("../integrations/erpnext/proxies/pos.proxy");
const erpnextOnboardingRouter = require("../integrations/erpnext/onboarding/onboarding");

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
    } catch {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id, "user:", (socket.user && socket.user.id) || "anonymous");
  });

  app.set("io", io);

  const { runTenantCron } = require("../tenant-platform/utils/tenantCron");
  runTenantCron().catch((err) => console.error("[TenantCron] startup error:", err.message));
  const tenantCronInterval = setInterval(() => runTenantCron().catch((err) => console.error("[TenantCron] error:", err.message)), 6 * 60 * 60 * 1000).unref();

  const { runSalonCron } = require("../verticals/salon/utils/salonCron");
  runSalonCron().catch((err) => console.error("[SalonCron] startup error:", err.message));
  const salonCronInterval = setInterval(() => runSalonCron().catch((err) => console.error("[SalonCron] error:", err.message)), 60 * 60 * 1000).unref();

  const { runBackupCron } = require("../tenant-platform/utils/backupCron");
  runBackupCron().catch((err) => console.error("[BackupCron] startup error:", err.message));
  const backupCronInterval = setInterval(() => runBackupCron().catch((err) => console.error("[BackupCron] error:", err.message)), 60 * 60 * 1000).unref();

  const { runScheduledReportsCron } = require("../tenant-platform/utils/scheduledReports.cron");
  runScheduledReportsCron().catch((err) => console.error("[ScheduledReportsCron] startup error:", err.message));
  const scheduledReportsCronInterval = setInterval(() => runScheduledReportsCron().catch((err) => console.error("[ScheduledReportsCron] error:", err.message)), 60 * 60 * 1000).unref();

  const workers = [];
  try {
    const nw = startNotificationWorker();
    const rw = startReportWorker();
    const bw = startBackupWorker();
    const pw = startProvisioningWorker();
    const wpw = startWalletPassSigningWorker();
    if (nw) workers.push(nw);
    if (rw) workers.push(rw);
    if (bw) workers.push(bw);
    if (pw) workers.push(pw);
    if (wpw) workers.push(wpw);
  } catch (err) {
    console.warn("BullMQ workers not started:", err.message);
  }

  const shutdownWorkers = async () => {
    await closeWalletPassSigningWorker();
    await Promise.all(workers.map((w) => w.close().catch(() => {})));
    clearInterval(tenantCronInterval);
    clearInterval(salonCronInterval);
    clearInterval(backupCronInterval);
  clearInterval(scheduledReportsCronInterval);
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

  app.use(cookieParser()); // codeql[js/missing-csrf-protection] Custom double-submit CSRF middleware applied below // codeql[js/missing-token-validation] Custom double-submit CSRF middleware applied below
  app.use(requestLogger);
  app.use(requestMetrics);
  app.use(requestTiming);
  app.use(setCsrfCookie);

  const CSRF_EXEMPT_PREFIXES = [
    "/api/v1/webhooks/paystack",
    "/api/v1/webhooks/shaqexpress",
    "/api/v1/sync",
  ];

  const csrfProtection = (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }
    if (CSRF_EXEMPT_PREFIXES.some((prefix) => req.path === prefix || req.path.startsWith(prefix + "/"))) {
      return next();
    }
    if (process.env.NODE_ENV === "test") {
      return next();
    }
    const clientToken = req.headers["x-xsrf-token"];
    const cookieToken = req.cookies?.["XSRF-TOKEN"];
    if (!clientToken || !cookieToken || clientToken.length !== cookieToken.length) {
      return res.status(403).json({
        success: false,
        message: "Invalid CSRF token.",
      });
    }
    const clientBuf = Buffer.from(clientToken, "utf8");
    const cookieBuf = Buffer.from(cookieToken, "utf8");
    if (!crypto.timingSafeEqual(clientBuf, cookieBuf)) {
      return res.status(403).json({
        success: false,
        message: "Invalid CSRF token.",
      });
    }
    next();
  };

  app.use(csrfProtection);

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

  app.use(tryCatchHandler(resolveTenant));
  app.use(tryCatchHandler(requireActiveTenant));

  app.use("/api/v1", generalLimiter, versioningHeaders, require("../routes"));
  app.use("/api/v1/auth", validateCsrfToken, authLimiter, authRouter);
  app.use("/api/v1/auth", authLimiter, passwordResetRouter);
  app.use("/api/v1/auth", authLimiter, emailVerificationRouter);
  app.use("/api/v1/audit-logs", generalLimiter, auditLogRouter);
  app.use("/api/v1/rbac", generalLimiter, logAction, validateCsrfToken, rbacRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminMiddleware, adminRouter);
  app.use("/api/v1/admin", logAction, validateCsrfToken, adminActionLimiter, adminMiddleware, walletPassAdminRouter);
  app.use("/api/v1/public", generalLimiter, publicRouter);
  app.use("/api/v1/public/status", generalLimiter, statusRouter);
  app.use("/api/v1/docs", generalLimiter, docsRouter);
  loadModules(app);

  app.get("/api/v1/health", tryCatchHandler(async (req, res) => {
    const queueAlerts = await checkQueueDepths();
    const redisStatus = redisClient ? (getConnectionStatus() ? "connected" : "disconnected") : "not_configured";
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      queueAlerts: queueAlerts.length ? queueAlerts : undefined,
    });
  }));

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
    erpnextReportsRouter,
    erpnextPosRouter,
    erpnextOnboardingRouter
  );
  app.use("/api/v1/notifications", generalLimiter, logAction, validateCsrfToken, notificationRouter);
  app.use("/api/v1/email-templates", generalLimiter, logAction, validateCsrfToken, emailTemplateRouter);
  app.use("/api/v1/webhooks", logAction, webhookLimiter, webhookRouter);
  app.use("/api/v1/webhooks/shaqexpress", logAction, webhookLimiter, shaqexpressRouter);
  app.use("/api/v1/sync", generalLimiter, logAction, syncLimiter, require("../routes/sync.router"));
  app.use("/api/v1/legal", generalLimiter, legalRouter);

  app.use(versioningHeaders);

  app.use("/api/v1/openapi.json", generalLimiter, (req, res) => {
    const spec = openapiSpec.generate(app);
    res.json(spec);
  });
  app.use("/api/v1/docs", openapiSpec.swaggerUi, openapiSpec.swaggerSetup);

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

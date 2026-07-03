const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");
const { Sentry } = require("../middleware/monitoring");
const tableRouter = require("../routes/table.router");
const reservationRouter = require("../routes/reservation.router");
const authRouter = require("../routes/auth.router");
const scheduleRouter = require("../routes/schedule.router");
const auditLogRouter = require("../routes/auditLog.router");
const rbacRouter = require("../routes/rbac.router");
const waitlistRouter = require("../routes/waitlist.router");
const paymentRouter = require("../routes/payment.router");
const reportRouter = require("../routes/report.router");
const customerRouter = require("../routes/customer.router");
const adminRouter = require("../routes/admin.router");
const notificationRouter = require("../routes/notification.router");
const emailTemplateRouter = require("../routes/emailTemplate.router");
const { setCsrfCookie, CSRF_HEADER_NAME } = require("../middleware/csrf");
const { requestMetrics, getStats } = require("../middleware/monitoring");
const { requestLogger } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");
const tryCatchHandler = require("../middleware/tryCatch");
const { protect } = require("../middleware/auth");

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
  app.use(helmet({ crossOriginResourcePolicy: false }));
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

  app.use("/api/v1", require("../routes"));
  app.use("/api/v1/tables", logAction, tableRouter);
  app.use("/api/v1/reservations", logAction, reservationRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/schedule", logAction, scheduleRouter);
  app.use("/api/v1/audit-logs", auditLogRouter);
  app.use("/api/v1/rbac", logAction, rbacRouter);
  app.use("/api/v1/waitlist", logAction, waitlistRouter);
  app.use("/api/v1/payments", logAction, paymentRouter);
  app.use("/api/v1/reports", logAction, reportRouter);
  app.use("/api/v1/customers", logAction, customerRouter);
  app.use("/api/v1/admin", logAction, adminRouter);
  app.use("/api/v1/notifications", logAction, notificationRouter);
  app.use("/api/v1/email-templates", logAction, emailTemplateRouter);
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
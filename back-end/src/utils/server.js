const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");
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
const { setCsrfCookie, CSRF_HEADER_NAME } = require("../middleware/csrf");
const { requestMetrics, getStats } = require("../middleware/monitoring");
const { requestLogger } = require("../middleware/requestLogger");
const { logAction } = require("../middleware/auditLog");
const { cspHeaders } = require("../middleware/csp");
const { getCurrentSecret } = require("../utils/jwtRotation");
const { Server } = require("socket.io");

const createServer = () => {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";
  const sslEnabled = process.env.SSL_ENABLED === "true";

  let server;
  if (isProd && sslEnabled) {
    try {
      const sslCertPath = process.env.SSL_CERT_PATH;
      const sslKeyPath = process.env.SSL_KEY_PATH;
      if (sslCertPath && sslKeyPath && fs.existsSync(sslCertPath) && fs.existsSync(sslKeyPath)) {
        const https = require("https");
        const sslOptions = {
          cert: fs.readFileSync(sslCertPath),
          key: fs.readFileSync(sslKeyPath),
        };
        server = https.createServer(sslOptions, app);
      } else {
        console.warn("SSL enabled but certificate files not found, falling back to HTTP");
        server = require("http").createServer(app);
      }
    } catch (err) {
      console.warn("SSL configuration failed, falling back to HTTP:", err.message);
      server = require("http").createServer(app);
    }
  } else {
    server = require("http").createServer(app);
  }

  const hstsEnabled = isProd && sslEnabled ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false;

  getCurrentSecret();
  
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(",").filter(o => o.trim()).join(",") || "http://localhost:8080",
      methods: ["GET", "POST"],
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

  const corsOrigins = process.env.CORS_ORIGINS?.split(",").filter(o => o.trim());
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : ["http://localhost:8080"];
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));
  app.use(express.json({ limit: "10kb" }));
  app.use(helmet({
    crossOriginResourcePolicy: false,
    hsts: hstsEnabled,
  }));
  app.use(cspHeaders);
  app.use(require("../middleware/sanitize").sanitize);

  app.get("/api/v1/csrf-token", (req, res) => {
    res.json({ success: true });
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
  app.get("/api/v1/stats", (req, res) => {
    res.json({ success: true, stats: getStats() });
  });
  app.use(notFound);
  app.use(errorHandler);
  return { app, server, io };
};

module.exports = createServer;

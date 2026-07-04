const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
  app.set("trust proxy", 1);
  const server = require("http").createServer(app);
  
  getCurrentSecret();

  const corsOrigins = process.env.CORS_ORIGINS?.split(",").filter(o => o.trim());
  const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : ["http://localhost:8080"];
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
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

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));
  app.use(express.json({ limit: "10kb" }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
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

"use strict";

const { requireVertical } = require("../../../middleware/requireVertical");
const { requiredFeature } = require("../../../tenant-platform/middleware/featureGuard");
const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter, tenantWriteLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");
const { generalLimiter } = require("../../../middleware/rateLimit");

const eventRouter = require("../routes/event.router");
const guestListRouter = require("../routes/guestList.router");
const ticketTypeRouter = require("../routes/ticketType.router");
const qrCodeRouter = require("../routes/qrCode.router");
const eventBookingRouter = require("../routes/eventBooking.router");
const eventPaymentRouter = require("../routes/eventPayment.router");
const webPassRouter = require("../routes/webPass.router");
const photoRouter = require("../routes/photo.router");
const walletPassRequestRouter = require("../routes/walletPassRequest.router");
const publicEventBookingRouter = require("../routes/publicEventBooking.router");
const eventTemplateRouter = require("../routes/eventTemplate.router");
const eventAnalyticsRouter = require("../routes/eventAnalytics.router");

const eventModule = {
  id: "event",
  name: "Event Vertical",
  version: "1.0.0",
  enabled: () => true,
  manifestPath: require("path").join(__dirname, "event.module.js"),
  routes: [
    { path: "/api/v1/events", router: eventRouter, middleware: [logAction, validateCsrfToken, tenantLimiter, requireVertical("event")] },
    { path: "/api/v1/events", router: guestListRouter, middleware: [logAction, validateCsrfToken, tenantLimiter, requireVertical("event"), requiredFeature("event_guest_list")] },
    { path: "/api/v1/events", router: ticketTypeRouter, middleware: [logAction, validateCsrfToken, tenantWriteLimiter, requireVertical("event"), requiredFeature("event_ticketing")] },
    { path: "/api/v1/events", router: qrCodeRouter, middleware: [logAction, requiredFeature("event_qr_checkin")] },
    { path: "/api/v1/events/bookings", router: eventBookingRouter, middleware: [logAction, validateCsrfToken, tenantWriteLimiter, requireVertical("event")] },
    { path: "/api/v1/events/bookings/:bookingId/payments", router: eventPaymentRouter, middleware: [logAction, validateCsrfToken, tenantWriteLimiter, requireVertical("event")] },
    { path: "/api/v1/public/e", router: webPassRouter, middleware: [tenantLimiter] },
    { path: "/api/v1/events/checkin/photo", router: photoRouter, middleware: [logAction, tenantLimiter] },
    { path: "/api/v1/events", router: walletPassRequestRouter, middleware: [logAction, validateCsrfToken, tenantLimiter, requireVertical("event"), requiredFeature("event_wallet_passes")] },
    { path: "/api/v1/public/events/bookings", router: publicEventBookingRouter, middleware: [generalLimiter] },
    { path: "/api/v1/public/events/bookings/:bookingId/payments/initialize", router: publicEventBookingRouter, middleware: [generalLimiter] },
    { path: "/api/v1/public/events/bookings/:id", router: publicEventBookingRouter, middleware: [generalLimiter] },
    { path: "/api/v1/events/templates", router: eventTemplateRouter, middleware: [logAction, validateCsrfToken, tenantLimiter, requireVertical("event")] },
    { path: "/api/v1/events", router: eventAnalyticsRouter, middleware: [logAction, tenantLimiter, requireVertical("event")] },
  ],
};

module.exports = { eventModule };

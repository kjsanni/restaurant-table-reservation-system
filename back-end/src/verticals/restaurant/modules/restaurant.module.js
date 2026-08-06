"use strict";

const { requireVertical } = require("../../../middleware/requireVertical");
const { requiredFeature, requiresServiceMode } = require("../../../tenant-platform/middleware/featureGuard");
const { logAction, validateCsrfToken } = require("../../../middleware");

const tableRouter = require("../routes/table.router");
const reservationRouter = require("../routes/reservation.router");
const scheduleRouter = require("../routes/schedule.router");
const shiftRouter = require("../routes/shift.router");
const timeOffRouter = require("../routes/timeOff.router");
const floorPlanRouter = require("../routes/floorPlan.router");
const waitlistRouter = require("../routes/waitlist.router");
const paymentRouter = require("../routes/payment.router");
const reportRouter = require("../routes/report.router");
const menuRouter = require("../routes/menu.router");
const orderRouter = require("../routes/order.router");
const promotionRouter = require("../routes/promotion.router");
const reviewRouter = require("../routes/review.router");
const customReportRouter = require("../routes/custom-report.router");
const customerRouter = require("../routes/customer.router");
const customerPortalRouter = require("../routes/customer-portal.router");
const deliveryRouter = require("../routes/delivery.router");
const whatsappRouter = require("../routes/whatsapp.router");

const restaurantModule = {
  id: "restaurant",
  name: "Restaurant Vertical",
  version: "1.0.0",
  enabled: () => true,
  manifestPath: require("path").join(__dirname, "restaurant.module.js"),
  routes: [
    { path: "/api/v1/tables", router: tableRouter, middleware: [logAction, validateCsrfToken, requiredFeature("table_management")] },
    { path: "/api/v1/reservations", router: reservationRouter, middleware: [logAction, validateCsrfToken, requiresServiceMode("dine_in")] },
    { path: "/api/v1/schedule", router: scheduleRouter, middleware: [logAction, validateCsrfToken, requiredFeature("staff_scheduling")] },
    { path: "/api/v1/shifts", router: shiftRouter, middleware: [logAction, validateCsrfToken, requiredFeature("staff_scheduling")] },
    { path: "/api/v1/time-offs", router: timeOffRouter, middleware: [logAction, validateCsrfToken, requiredFeature("staff_scheduling")] },
    { path: "/api/v1/floor-plans", router: floorPlanRouter, middleware: [logAction, validateCsrfToken, requiredFeature("table_management")] },
    { path: "/api/v1/waitlist", router: waitlistRouter, middleware: [logAction, validateCsrfToken, requireVertical("restaurant"), requiredFeature("waitlist"), requiresServiceMode("dine_in")] },
    { path: "/api/v1/payments", router: paymentRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/reports", router: reportRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/menu", router: menuRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/orders", router: orderRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/promotions", router: promotionRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/reviews", router: reviewRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/custom-reports", router: customReportRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/customers", router: customerRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/customer-portal", router: customerPortalRouter, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/deliveries", router: deliveryRouter, middleware: [logAction, validateCsrfToken, requiresServiceMode("delivery")] },
    { path: "/api/v1/whatsapp", router: whatsappRouter, middleware: [logAction, validateCsrfToken] },
  ],
};

module.exports = { restaurantModule };

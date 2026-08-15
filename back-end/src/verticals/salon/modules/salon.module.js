"use strict";

const { logAction, validateCsrfToken } = require("../../../middleware");
const { tenantLimiter } = require("../../../tenant-platform/middleware/tenantRateLimit");

const salonAppointmentRoutes = require("../routes/appointment.router");
const salonStationRoutes = require("../routes/station.router");
const salonServiceRoutes = require("../routes/service.router");
const salonServicePackageRoutes = require("../routes/servicePackage.router");
const salonGiftCardRoutes = require("../routes/giftCard.router");
const salonReferralRoutes = require("../routes/referral.router");
const salonLocationRoutes = require("../routes/location.router");
const salonInventoryRoutes = require("../routes/inventoryItem.router");
const salonExpensesRoutes = require("../routes/expense.router");
const salonPricingRulesRoutes = require("../routes/pricingRule.router");
const salonCommissionRoutes = require("../routes/commission.router");
const salonCustomerPortalRoutes = require("../../../routes/salon-customer-portal.router");
const salonReportsRoutes = require("../../../routes/salon-reports.router");
const salonRecurringAppointmentRoutes = require("../routes/recurring-appointment.router");
const salonClientSegmentationRoutes = require("../routes/client-segmentation.router");
const salonStaffRoutes = require("../routes/staff.router");
const salonMarketingCampaignRoutes = require("../routes/marketing-campaign.router");
const salonGalleryRoutes = require("../routes/gallery.router");
const salonDashboardRoutes = require("../../../routes/salon-dashboard.router");
const salonWhatsAppRoutes = require("../routes/salonWhatsApp.router");
const salonScheduledReportRoutes = require("../routes/scheduledReport.router");
const salonInventoryTransferRoutes = require("../routes/inventoryTransfer.router");
const salonStaffLocationAssignmentRoutes = require("../routes/staffLocationAssignment.router");
const crossLocationDashboardRoutes = require("../../../routes/cross-location-dashboard.router");

const salonModule = {
  id: "salon",
  name: "Salon Vertical",
  version: "1.0.0",
  enabled: () => true,
  manifestPath: require("path").join(__dirname, "salon.module.js"),
  routes: [
    { path: "/api/v1/salon/appointments", router: salonAppointmentRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/stations", router: salonStationRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/services", router: salonServiceRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/packages", router: salonServicePackageRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/gift-cards", router: salonGiftCardRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/referrals", router: salonReferralRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/locations", router: salonLocationRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/inventory", router: salonInventoryRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/expenses", router: salonExpensesRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/pricing", router: salonPricingRulesRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/commissions", router: salonCommissionRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/customer-portal", router: salonCustomerPortalRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/reports", router: salonReportsRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/recurring-appointments", router: salonRecurringAppointmentRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/client-segmentation", router: salonClientSegmentationRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/staff", router: salonStaffRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/marketing-campaigns", router: salonMarketingCampaignRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/gallery", router: salonGalleryRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/dashboard", router: salonDashboardRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/whatsapp", router: salonWhatsAppRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/scheduled-reports", router: salonScheduledReportRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/inventory-transfers", router: salonInventoryTransferRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/staff-location-assignments", router: salonStaffLocationAssignmentRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
    { path: "/api/v1/salon/cross-location-dashboard", router: crossLocationDashboardRoutes, middleware: [logAction, validateCsrfToken, tenantLimiter] },
  ],
};

module.exports = { salonModule };

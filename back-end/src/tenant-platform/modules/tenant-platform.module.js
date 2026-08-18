"use strict";

const { adminMiddleware } = require("../../middleware/adminMiddleware");
const { logAction, validateCsrfToken } = require("../../middleware");
const { webhookLimiter, adminActionLimiter } = require("../../middleware/rateLimit");

const tenantAdminRoutes = require("../routes/tenantAdmin.router");
const planRoutes = require("../routes/plan.router");
const platformPaymentRoutes = require("../routes/platformPayment.router");
const usageRoutes = require("../routes/usage.router");
const meteringRoutes = require("../routes/metering.router");
const changeManagementRoutes = require("../routes/change-management.router");
const revenueRoutes = require("../routes/revenue.router");
const bulkActionRoutes = require("../routes/bulkAction.router");
const noteRoutes = require("../routes/note.router");
const onboardingRoutes = require("../routes/onboarding.router");
const trialRoutes = require("../routes/trial.router");
const invoiceRoutes = require("../routes/invoice.router");
const billingEmailRoutes = require("../routes/billingEmail.router");
const statusTimelineRoutes = require("../routes/statusTimeline.router");
const gracePeriodRoutes = require("../routes/gracePeriod.router");
const whiteLabelRoutes = require("../routes/whiteLabel.router");
const apiKeyRoutes = require("../routes/apiKey.router");
const platformAuditRoutes = require("../routes/platformAudit.router");
const notificationRoutes = require("../routes/notification.router");
const supportTicketAnalyticsRoutes = require("../routes/supportTicketAnalytics.router");
const supportTicketRoutes = require("../routes/supportTicket.router");
const totpRoutes = require("../routes/totp.router");
const sessionRoutes = require("../routes/session.router");
const incidentRoutes = require("../routes/incident.router");
const failedPaymentAlertRoutes = require("../routes/failedPaymentAlert.router");
const backupRoutes = require("../routes/backup.router");
const deploymentRoutes = require("../routes/deployment.router");
const securityRoutes = require("../routes/security.router");
const complianceRoutes = require("../routes/compliance.router");
// const supportChatRoutes = require("../routes/supportChat.router");
const supportTemplateRoutes = require("../routes/supportTemplate.router");
const featureFlagRoutes = require("../routes/featureFlag.router");
const tenantSupportRoutes = require("../routes/tenantSupport.router");
const financialManagementRoutes = require("../routes/financialManagement.router");
const whistleblowerTipRoutes = require("../routes/whistleblowerTip.router");
const integrationAnalyticsRoutes = require("../routes/integrationAnalytics.router");
const impersonationRoutes = require("../routes/impersonation.router");
const advancedAnalyticsRoutes = require("../routes/advancedAnalytics.router");
const tenantCustomizationRoutes = require("../routes/tenant-customization.router");
const dataResidencyRoutes = require("../routes/data-residency.router");
const platformRoleRoutes = require("../routes/platform-role.router");
const maintenanceRoutes = require("../routes/maintenance.router");
const trustSafetyRoutes = require("../routes/trustSafety.router");
const monitoringRoutes = require("../routes/monitoring.router");
const verticalAnalyticsRoutes = require("../routes/verticalAnalytics.router");
const dataRetentionRoutes = require("../routes/dataRetention.router");
const suspiciousActivityRoutes = require("../routes/suspiciousActivity.router");
const subProcessorRoutes = require("../routes/subProcessor.router");
const platformReportRoutes = require("../routes/platformReport.router");
const alertRuleRoutes = require("../routes/alertRule.router");
const reconciliationRoutes = require("../routes/reconciliation.router");
const paystackConfigRoutes = require("../routes/paystackConfig.router");
const shaqExpressConversionRoutes = require("../routes/shaqExpressConversion.router");
const marketplaceRoutes = require("../routes/marketplace.router");
const caseStudyRoutes = require("../routes/caseStudy.router");
const platformReferralRoutes = require("../routes/platformReferral.router");
const crossTenantSearchRoutes = require("../routes/crossTenantSearch.router");
const penetrationTestReportRoutes = require("../routes/penetrationTestReport.router");
const insuranceDocumentRoutes = require("../routes/insuranceDocument.router");
const tenantMigrationRoutes = require("../routes/tenantMigration.router");
const encryptionKeyRoutes = require("../routes/encryptionKey.router");
const autoScalingTriggerRoutes = require("../routes/autoScalingTrigger.router");
const complianceEvidenceRoutes = require("../routes/complianceEvidence.router");
const dataAnonymizationRoutes = require("../routes/dataAnonymization.router");
const platformSettingsRoutes = require("../routes/platformSettings.router");
const legalAcceptanceRoutes = require("../routes/legalAcceptance.router");
const dsarRequestRoutes = require("../routes/dsarRequest.router");
const publicDsarRoutes = require("../routes/publicDsar.router");
const publicTenantRoutes = require("../routes/publicTenant.router");
const benchmarkRoutes = require("../routes/benchmark.router");
const billingRoutes = require("../routes/billing.router");
const apiLatencyRoutes = require("../routes/apiLatency.router");
const cacheStatsRoutes = require("../routes/cacheStats.router");
const verticalTemplateRoutes = require("../routes/verticalTemplate.router");
const webhookEndpointRoutes = require("../routes/webhookEndpoint.router");
const supportNoteRoutes = require("../routes/supportNote.router");
const supportAttachmentRoutes = require("../routes/supportAttachment.router");
const complianceRuleRoutes = require("../routes/complianceRule.router");
const notificationTemplateRoutes = require("../routes/notificationTemplate.router");
const announcementRoutes = require("../routes/announcement.router");
const dataRetentionPolicyRoutes = require("../routes/dataRetentionPolicy.router");
const postmortemRoutes = require("../routes/postmortem.router");
const provisioningRoutes = require("../routes/provisioning.router");
const migrationRoutes = require("../routes/migration.router");
const debugRoutes = require("../routes/debug.router");
const breakGlassRoutes = require("../routes/breakGlass.router");

const erpnextRoutes = require("../routes/erpnext.router");
const tenantPlatformModule = {
  id: "tenant-platform",
  name: "Tenant Platform",
  version: "1.0.0",
  enabled: () => true,
  manifestPath: require("path").join(__dirname, "tenant-platform.module.js"),
  routes: [
    { path: "/api/v1/admin/tenants", router: trialRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: invoiceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: statusTimelineRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: gracePeriodRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: whiteLabelRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: apiKeyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: onboardingRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: legalAcceptanceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: dsarRequestRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: noteRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: tenantAdminRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: tenantMigrationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: provisioningRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: tenantCustomizationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/tenants", router: dataResidencyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/plans", router: planRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/payments", router: platformPaymentRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/usage", router: usageRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/metering", router: meteringRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/change-management", router: changeManagementRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/revenue", router: revenueRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/bulk", router: bulkActionRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/billing-emails", router: billingEmailRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/audit", router: platformAuditRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/notifications", router: notificationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-tickets", router: supportTicketAnalyticsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-tickets", router: supportTicketRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-tickets/tenant", router: tenantSupportRoutes, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/admin/totp", router: totpRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/sessions", router: sessionRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/incidents", router: incidentRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/payment-alerts", router: failedPaymentAlertRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/backups", router: backupRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/deployment", router: deploymentRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/security", router: securityRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/compliance", router: complianceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    // { path: "/api/v1/admin/support-chat", router: supportChatRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-notes", router: supportNoteRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-attachments", router: supportAttachmentRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/compliance-rules", router: complianceRuleRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/notification-templates", router: notificationTemplateRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/announcements", router: announcementRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/data-retention/policies", router: dataRetentionPolicyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/support-templates", router: supportTemplateRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/feature-flags", router: featureFlagRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/financial", router: financialManagementRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/whistleblower", router: whistleblowerTipRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/integrations", router: integrationAnalyticsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/impersonation", router: impersonationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/analytics", router: advancedAnalyticsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/platform", router: platformRoleRoutes, middleware: [logAction, validateCsrfToken, adminActionLimiter, adminMiddleware] },
    { path: "/api/v1/admin/maintenance", router: maintenanceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/trust-safety", router: trustSafetyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/monitoring", router: monitoringRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/monitoring/api-latency", router: apiLatencyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/monitoring/cache", router: cacheStatsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/vertical-analytics", router: verticalAnalyticsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/vertical-templates", router: verticalTemplateRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/data-retention", router: dataRetentionRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/suspicious-activity", router: suspiciousActivityRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/sub-processors", router: subProcessorRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/platform-reports", router: platformReportRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/alert-rules", router: alertRuleRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/reconciliation", router: reconciliationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/paystack", router: paystackConfigRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/shaqexpress", router: shaqExpressConversionRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/marketplace", router: marketplaceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/case-studies", router: caseStudyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/referrals", router: platformReferralRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/search", router: crossTenantSearchRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/penetration-tests", router: penetrationTestReportRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/insurance-documents", router: insuranceDocumentRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/encryption-keys", router: encryptionKeyRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/auto-scaling", router: autoScalingTriggerRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/compliance", router: complianceEvidenceRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/debug", router: debugRoutes, middleware: [logAction, validateCsrfToken, adminActionLimiter, adminMiddleware] },
    { path: "/api/v1/admin/migration", router: migrationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/postmortems", router: postmortemRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/data-anonymization", router: dataAnonymizationRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/platform-settings", router: platformSettingsRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/benchmarks", router: benchmarkRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/break-glass", router: breakGlassRoutes, middleware: [logAction, validateCsrfToken, adminMiddleware] },
    { path: "/api/v1/admin/erpnext", router: erpnextRoutes, middleware: [logAction, validateCsrfToken, adminActionLimiter, adminMiddleware] },
    { path: "/api/v1/billing", router: billingRoutes, middleware: [logAction, validateCsrfToken] },
    { path: "/api/v1/public/dsar-request", router: publicDsarRoutes },
    { path: "/api/v1/public/tenants", router: publicTenantRoutes },
    { path: "/api/v1/webhooks", router: webhookEndpointRoutes, middleware: [webhookLimiter] },
  ],
};

module.exports = { tenantPlatformModule };

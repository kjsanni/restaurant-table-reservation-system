import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/CustomerLandingView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/customer",
      name: "customer-landing",
      component: () => import("../views/CustomerLandingView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/onboarding",
      name: "onboarding",
      component: () => import("../views/OnboardingView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/reservations",
      name: "reservations",
      component: () => import("../views/ReservationsView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
    {
      path: "/dashboard",
      name: "tenant-landing",
      component: () => import("../views/TenantDashboardView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
    {
      path: "/new-reservation",
      name: "new-reservation",
      component: () => import("../views/NewReservationView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
    {
      path: "/admin/settings",
      name: "admin-settings",
      component: () => import("../views/AdminSettingsView.vue"),
      meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/settings/whatsapp-ordering",
      name: "whatsapp-ordering-settings",
      component: () => import("../views/WhatsAppOrderingSettingsView.vue"),
      meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/settings/whatsapp-preview",
      name: "whatsapp-chat-preview",
      component: () => import("../views/WhatsAppChatPreviewView.vue"),
      meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/schedule",
      name: "schedule",
      component: () => import("../views/ScheduleView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_schedule",
      },
    },
    {
      path: "/calendar",
      name: "calendar",
      component: () => import("../views/CalendarView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_schedule",
      },
    },
    {
      path: "/floor-plan",
      name: "floor-plan",
      component: () => import("../views/FloorPlanView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_tables",
      },
    },
    {
      path: "/reports",
      name: "reports",
      component: () => import("../views/ReportView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/heatmap",
      name: "heatmap",
      component: () => import("../views/HeatmapView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/tables/manage",
      name: "table-management",
      component: () => import("../views/TableManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_tables",
      },
    },
    {
      path: "/admin/floorplan",
      name: "floorplan-editor",
      component: () => import("../views/FloorPlanEditorView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_tables",
      },
    },
    {
      path: "/admin/email-templates",
      name: "email-templates",
      component: () => import("../views/EmailTemplatesView.vue"),
      meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/staff/manage",
      name: "staff-management",
      component: () => import("../views/StaffManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_staff",
      },
    },
    {
      path: "/roles/manage",
      name: "role-management",
      component: () => import("../views/RoleManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_roles",
      },
    },
    {
      path: "/groups/manage",
      name: "group-management",
      component: () => import("../views/GroupManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_groups",
      },
    },
    {
      path: "/waitlist",
      name: "waitlist",
      component: () => import("../views/WaitlistView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_tables",
      },
    },
    {
      path: "/audit-logs",
      name: "audit-logs",
      component: () => import("../views/AuditLogView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_audit_logs",
      },
    },
    {
      path: "/search",
      name: "search",
      component: () => import("../views/SearchView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
    {
      path: "/menu",
      name: "menu",
      component: () => import("../views/MenuView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/menu/manage",
      name: "menu-management",
      component: () => import("../views/MenuManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_menu",
      },
    },
    {
      path: "/checkout",
      name: "checkout",
      component: () => import("../views/CheckoutView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/checkout/success/:orderId",
      name: "order-confirmation",
      component: () => import("../views/OrderConfirmationView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/orders",
      name: "orders",
      component: () => import("../views/customer/CustomerPortalOrdersView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
    {
      path: "/orders/track/:orderId",
      name: "order-track",
      component: () => import("../views/OrderTrackView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/orders/manage",
      name: "order-dashboard",
      component: () => import("../views/OrderDashboardView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_orders",
      },
    },
    {
      path: "/deliveries",
      name: "delivery-dashboard",
      component: () => import("../views/DeliveryDashboardView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_orders",
      },
    },
    {
      path: "/promotions",
      name: "promotions-management",
      component: () => import("../views/PromotionsManagementView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_settings",
      },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/payments",
      name: "payments",
      component: () => import("../views/PaymentDashboardView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/revenue",
      name: "revenue-report",
      component: () => import("../views/RevenueReportView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/admin/email-templates",
      name: "email-template-list",
      component: () => import("../views/EmailTemplateListView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "manage_settings",
      },
    },
    {
      path: "/admin/customers/:id",
      name: "admin-customer-profile",
      component: () => import("../views/CustomerProfileView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/no-shows",
      name: "no-shows",
      component: () => import("../views/NoShowView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reservations",
      },
    },
    {
      path: "/legal/:slug",
      name: "legal-document",
      component: () => import("../views/legal/LegalDocumentView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/dsar",
      name: "dsar-submit",
      component: () => import("../views/DsarSubmissionView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
      meta: { standalone: true },
    },
  ],
});

if (import.meta.env.VITE_TENANT_MODE === "enabled") {
  router.addRoute({
    path: "/super-admin/login",
    name: "super-admin-login",
    component: () => import("../views/admin/SuperAdminLoginView.vue"),
    meta: { standalone: true },
  });
  router.addRoute({
    path: "/t/:tenantSlug/login",
    name: "tenant-login",
    component: () => import("../views/tenant/TenantLoginView.vue"),
    meta: { standalone: true },
  });
  router.addRoute({
    path: "/t/:tenantSlug/portal",
    name: "customer-portal",
    component: () => import("../views/customer/CustomerPortalView.vue"),
    meta: { tenantScoped: true },
  });
  router.addRoute({
    path: "/admin/tenants",
    name: "tenant-dashboard",
    component: () => import("../views/admin/TenantDashboardView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/overview",
    name: "super-admin-overview",
    component: () => import("../views/admin/SuperAdminOverviewView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id",
    name: "tenant-detail",
    component: () => import("../views/admin/TenantDetailView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/api-keys",
    name: "tenant-api-keys",
    component: () => import("../views/admin/ApiKeyManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/branding",
    name: "tenant-branding",
    component: () => import("../views/admin/WhiteLabelBrandingView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/grace-period",
    name: "tenant-grace-period",
    component: () => import("../views/admin/GracePeriodSettingsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/timeline",
    name: "tenant-timeline",
    component: () => import("../views/admin/TenantStatusTimelineView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/timeline",
    name: "tenant-timeline",
    component: () => import("../views/admin/TenantStatusTimelineView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/notes",
    name: "tenant-notes",
    component: () => import("../views/admin/TenantDetailView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/trial",
    name: "tenant-trial",
    component: () => import("../views/admin/TrialManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/invoices",
    name: "tenant-invoices",
    component: () => import("../views/admin/InvoiceManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/onboarding",
    name: "tenant-onboarding",
    component: () => import("../views/admin/OnboardingChecklistView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/tenants/:id/dsar",
    name: "tenant-dsar",
    component: () => import("../views/admin/DsarManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/onboarding/wizard",
    name: "tenant-setup-wizard",
    component: () => import("../views/TenantSetupWizardView.vue"),
    meta: { requiresAuth: true },
  });
  router.addRoute({
    path: "/admin/plans",
    name: "plans-management",
    component: () => import("../views/admin/PlansManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/payments",
    name: "platform-payment-dashboard",
    component: () => import("../views/admin/PlatformPaymentDashboard.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/usage",
    name: "platform-usage",
    component: () => import("../views/admin/PlatformUsageView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/revenue",
    name: "platform-revenue",
    component: () => import("../views/admin/RevenueReportsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/bulk",
    name: "platform-bulk-actions",
    component: () => import("../views/admin/BulkActionsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/financial",
    name: "platform-financial",
    component: () => import("../views/admin/FinancialManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/feature-flags",
    name: "platform-feature-flags",
    component: () => import("../views/admin/FeatureFlagsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/integrations",
    name: "platform-integrations",
    component: () => import("../views/admin/IntegrationAnalyticsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/impersonation",
    name: "platform-impersonation",
    component: () => import("../views/admin/ImpersonationView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/analytics",
    name: "platform-analytics",
    component: () => import("../views/admin/AdvancedAnalyticsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/billing-emails",
    name: "billing-email-templates",
    component: () => import("../views/admin/BillingEmailTemplatesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/backups",
    name: "platform-backups",
    component: () => import("../views/admin/BackupManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/maintenance",
    name: "platform-maintenance",
    component: () => import("../views/admin/MaintenanceModeView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/trust-safety",
    name: "platform-trust-safety",
    component: () => import("../views/admin/TrustSafetyView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/support-tickets",
    name: "platform-support-tickets",
    component: () => import("../views/admin/SupportTicketsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/support-templates",
    name: "platform-support-templates",
    component: () => import("../views/admin/SupportTemplatesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/support-chat",
    name: "platform-support-chat",
    component: () => import("../views/admin/SupportChatView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/monitoring",
    name: "platform-monitoring",
    component: () => import("../views/admin/PerformanceMonitoringView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/monitoring/api-latency",
    name: "platform-api-latency",
    component: () => import("../views/admin/ApiLatencyView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/monitoring/cache",
    name: "platform-cache-stats",
    component: () => import("../views/admin/CacheStatsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/vertical-analytics",
    name: "platform-vertical-analytics",
    component: () => import("../views/admin/VerticalAnalyticsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/vertical-templates",
    name: "platform-vertical-templates",
    component: () => import("../views/admin/VerticalTemplatesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/compliance-rules",
    name: "platform-compliance-rules",
    component: () => import("../views/admin/ComplianceRulesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/notification-templates",
    name: "platform-notification-templates",
    component: () => import("../views/admin/NotificationTemplatesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/announcements",
    name: "platform-announcements",
    component: () => import("../views/admin/AnnouncementsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/data-retention/policies",
    name: "platform-data-retention-policies",
    component: () => import("../views/admin/DataRetentionPoliciesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/data-retention",
    name: "platform-data-retention",
    component: () => import("../views/admin/DataRetentionView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/audit",
    name: "platform-audit-log",
    component: () => import("../views/admin/PlatformAuditLogView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/incidents",
    name: "platform-incidents",
    component: () => import("../views/admin/IncidentManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/suspicious-activity",
    name: "platform-suspicious-activity",
    component: () => import("../views/admin/SuspiciousActivityView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/sub-processors",
    name: "platform-sub-processors",
    component: () => import("../views/admin/SubProcessorsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/debug",
    name: "platform-debug",
    component: () => import("../views/admin/DebugToolsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/status",
    name: "platform-status",
    component: () => import("../views/admin/SystemStatusView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/migration",
    name: "platform-migration",
    component: () => import("../views/admin/MigrationToolsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/change-management",
    name: "platform-change-management",
    component: () => import("../views/admin/ChangeManagementView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/postmortems",
    name: "platform-postmortems",
    component: () => import("../views/admin/IncidentPostmortemView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/fraud",
    name: "platform-fraud",
    component: () => import("../views/admin/FraudPreventionView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/at-risk-tenants",
    name: "platform-at-risk-tenants",
    component: () => import("../views/admin/AtRiskTenantsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/notifications",
    name: "platform-notifications",
    component: () => import("../views/admin/NotificationCenterView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/admin/benchmarks",
    name: "platform-benchmarks",
    component: () => import("../views/admin/BenchmarkView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/appointments",
    name: "appointments",
    component: () => import("../views/salon/AppointmentsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/stations",
    name: "stations",
    component: () => import("../views/salon/StationsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_stations" },
  });
  router.addRoute({
    path: "/station-map",
    name: "station-map",
    component: () => import("../views/salon/StationMapView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/services",
    name: "salon-services",
    component: () => import("../views/salon/ServicesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_services" },
  });
  router.addRoute({
    path: "/packages",
    name: "salon-packages",
    component: () => import("../views/salon/SalonPackagesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_services" },
  });
  router.addRoute({
    path: "/gift-cards",
    name: "salon-gift-cards",
    component: () => import("../views/salon/SalonGiftCardsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/referrals",
    name: "salon-referrals",
    component: () => import("../views/salon/SalonReferralsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/locations",
    name: "salon-locations",
    component: () => import("../views/salon/SalonLocationsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
  });
  router.addRoute({
    path: "/inventory",
    name: "salon-inventory",
    component: () => import("../views/salon/SalonInventoryView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/expenses",
    name: "salon-expenses",
    component: () => import("../views/salon/SalonExpensesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/pricing",
    name: "salon-pricing",
    component: () => import("../views/salon/SalonPricingRulesView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/salon/settings",
    name: "salon-settings",
    component: () => import("../views/salon/SalonSettingsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon" },
  });
  router.addRoute({
    path: "/salon/walkins",
    name: "salon-walkins",
    component: () => import("../views/salon/SalonWalkInQueueView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/calendar",
    name: "salon-calendar",
    component: () => import("../views/salon/SalonCalendarView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/shifts",
    name: "salon-shifts",
    component: () => import("../views/salon/SalonStaffShiftsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
  });
  router.addRoute({
    path: "/salon/schedule",
    name: "salon-schedule",
    component: () => import("../views/ScheduleView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
  });
  router.addRoute({
    path: "/salon/holidays",
    name: "salon-holidays",
    component: () => import("../views/salon/SalonHolidaysView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
  });
  router.addRoute({
    path: "/salon/reports",
    name: "salon-reports",
    component: () => import("../views/salon/SalonReportsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/recurring",
    name: "salon-recurring",
    component: () => import("../views/salon/SalonRecurringView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/clients",
    name: "salon-clients",
    component: () => import("../views/salon/SalonClientsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/marketing",
    name: "salon-marketing",
    component: () => import("../views/salon/MarketingCampaignsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_settings" },
  });
  router.addRoute({
    path: "/salon/gallery",
    name: "salon-gallery",
    component: () => import("../views/salon/SalonGalleryView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_services" },
  });
  router.addRoute({
    path: "/salon/unified-schedule",
    name: "salon-unified-schedule",
    component: () => import("../views/salon/SalonUnifiedScheduleView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_schedule" },
  });
  router.addRoute({
    path: "/salon/whatsapp-bookings",
    name: "salon-whatsapp-bookings",
    component: () => import("../views/salon/SalonWhatsAppBookingsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/whatsapp-payments",
    name: "salon-whatsapp-payments",
    component: () => import("../views/salon/SalonWhatsAPPaymentsView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/dashboard",
    name: "salon-dashboard",
    component: () => import("../views/salon/SalonDashboardView.vue"),
    meta: { requiresAuth: true, requiresPermission: "view_appointments" },
  });
  router.addRoute({
    path: "/salon/staff",
    name: "salon-staff",
    component: () => import("../views/salon/SalonStaffView.vue"),
    meta: { requiresAuth: true, requiresPermission: "manage_staff" },
  });
}

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (
    to.meta.requiresAuth &&
    !authStore.isAuthenticated &&
    !authStore.isLoading
  ) {
    next({ name: "login" });
  } else if (
    to.meta.requiresAdmin &&
    !authStore.isLoading &&
    authStore.user?.role !== "admin"
  ) {
    next({ name: "home" });
  } else if (
    to.meta.requiresPermission &&
    !authStore.isLoading &&
    !authStore.user?.permissions?.[to.meta.requiresPermission]
  ) {
    next({ name: "home" });
  } else if (
    to.meta.requiresVertical &&
    authStore.currentTenant?.businessVertical !== to.meta.requiresVertical
  ) {
    next({ name: "home" });
  } else if (
    to.path.startsWith("/admin") &&
    !authStore.isSuperAdmin &&
    !["/admin/settings", "/admin/floorplan", "/admin/email-templates"].some(
      (p) => to.path === p || to.path.startsWith(`${p}/`)
    )
  ) {
    next({ name: "home" });
  } else if (
    (to.name === "login" ||
      to.name === "super-admin-login" ||
      to.name === "tenant-login") &&
    authStore.isAuthenticated &&
    !authStore.isLoading
  ) {
    if (authStore.isSuperAdmin) {
      next({ name: "super-admin-overview" });
    } else if (
      authStore.user?.permissions?.manage_tenants ||
      authStore.user?.role === "admin"
    ) {
      next({ name: "tenant-landing" });
    } else {
      next({ name: "tenant-landing" });
    }
  } else if (
    to.name === "home" &&
    authStore.isAuthenticated &&
    !authStore.isLoading
  ) {
    if (authStore.isSuperAdmin) {
      next({ name: "super-admin-overview" });
    } else if (
      authStore.user?.permissions?.manage_tenants ||
      authStore.user?.role === "admin"
    ) {
      next({ name: "tenant-landing" });
    } else {
      next({ name: "tenant-landing" });
    }
  } else {
    next();
  }
});

const customerPortalRoutes = [
  {
    path: "/portal",
    name: "customer-portal-home",
    component: () => import("../views/customer/CustomerPortalHomeView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/portal/profile",
    name: "customer-profile",
    component: () => import("../views/customer/CustomerPortalProfileView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/portal/reservations",
    name: "customer-reservations",
    component: () =>
      import("../views/customer/CustomerPortalReservationsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/portal/orders",
    name: "customer-orders",
    component: () => import("../views/customer/CustomerPortalOrdersView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/portal/appointments",
    name: "customer-appointments",
    component: () =>
      import("../views/customer/CustomerPortalAppointmentsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon" },
  },
  {
    path: "/portal/gift-cards",
    name: "customer-gift-cards",
    component: () =>
      import("../views/customer/CustomerPortalGiftCardsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon" },
  },
  {
    path: "/portal/referrals",
    name: "customer-referrals",
    component: () =>
      import("../views/customer/CustomerPortalReferralsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon" },
  },
  {
    path: "/portal/packages",
    name: "customer-packages",
    component: () => import("../views/customer/CustomerPortalPackagesView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon" },
  },
];

customerPortalRoutes.forEach((route) => router.addRoute(route));

export default router;

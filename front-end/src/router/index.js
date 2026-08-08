import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => {
        const portalMode =
          typeof __VITE_PORTAL_MODE__ !== "undefined"
            ? __VITE_PORTAL_MODE__
            : window.location.port === "8080"
              ? "super-admin"
              : window.location.port === "8081"
                ? "tenant"
                : "customer";

        if (portalMode === "super-admin") {
          return import("../views/admin/SuperAdminLandingView.vue");
        }
        return import("../views/CustomerLandingView.vue");
      },
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
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../views/ForgotPasswordView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/reset-password/:token",
      name: "reset-password",
      component: () => import("../views/ResetPasswordView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/verify-email/:token",
      name: "verify-email",
      component: () => import("../views/VerifyEmailView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/pricing",
      name: "pricing",
      component: () => import("../views/PricingView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/status",
      name: "status",
      component: () => import("../views/StatusPageView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/api-docs",
      name: "api-docs",
      component: () => import("../views/ApiDocsView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/changelog",
      name: "changelog",
      component: () => import("../views/ChangelogView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/help",
      name: "help-center",
      component: () => import("../views/HelpCenterView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/reservations",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "reservations",
          component: () => import("../views/ReservationsView.vue"),
          meta: { standalone: true, requiresAuth: true },
        },
      ],
    },
    {
      path: "/dashboard",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "tenant-landing",
          component: () => import("../views/TenantDashboardView.vue"),
          meta: { standalone: true, requiresAuth: true },
        },
      ],
    },
    {
      path: "/erpnext/accounting",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "erpnext-accounting",
          component: () => import("../views/ErpnextAccountingView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresFeature: "erpnext_accounting",
          },
        },
      ],
    },
    {
      path: "/erpnext/inventory",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "erpnext-inventory",
          component: () => import("../views/ErpnextInventoryView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresFeature: "erpnext_stock",
          },
        },
      ],
    },
    {
      path: "/erpnext/employees",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "erpnext-employees",
          component: () => import("../views/ErpnextEmployeesView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresFeature: "erpnext_hr",
          },
        },
      ],
    },
    {
      path: "/erpnext/crm",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "erpnext-crm",
          component: () => import("../views/ErpnextCrmView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresFeature: "erpnext_crm",
          },
        },
      ],
    },
    {
      path: "/erpnext/manufacturing",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "erpnext-manufacturing",
          component: () => import("../views/ErpnextManufacturingView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresFeature: "erpnext_manufacturing",
          },
        },
      ],
    },
    {
      path: "/new-reservation",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "new-reservation",
          component: () => import("../views/NewReservationView.vue"),
          meta: { standalone: true, requiresAuth: true },
        },
      ],
    },
    {
      path: "/admin/settings",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "admin-settings",
          component: () => import("../views/AdminSettingsView.vue"),
          meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    {
      path: "/admin/settings/whatsapp-ordering",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "whatsapp-ordering-settings",
          component: () => import("../views/WhatsAppOrderingSettingsView.vue"),
          meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    {
      path: "/admin/settings/whatsapp-preview",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "whatsapp-chat-preview",
          component: () => import("../views/WhatsAppChatPreviewView.vue"),
          meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    {
      path: "/schedule",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "schedule",
          component: () => import("../views/ScheduleView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_schedule",
          },
        },
      ],
    },
    {
      path: "/calendar",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "calendar",
          component: () => import("../views/CalendarView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_schedule",
          },
        },
      ],
    },
    {
      path: "/floor-plan",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "floor-plan",
          component: () => import("../views/FloorPlanView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_tables",
          },
        },
      ],
    },
    {
      path: "/reports",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "reports",
          component: () => import("../views/ReportView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_reservations",
          },
        },
      ],
    },
    {
      path: "/reviews",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "reviews",
          component: () => import("../views/admin/ReviewsManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_settings",
          },
        },
      ],
    },
    {
      path: "/custom-reports",
      name: "custom-reports",
      component: () => import("../views/admin/CustomReportBuilderView.vue"),
      meta: {
        standalone: true,
        requiresAuth: true,
        requiresPermission: "view_reports",
      },
    },
    {
      path: "/heatmap",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "heatmap",
          component: () => import("../views/HeatmapView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_reservations",
          },
        },
      ],
    },
    {
      path: "/tables/manage",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "table-management",
          component: () => import("../views/TableManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_tables",
          },
        },
      ],
    },
    {
      path: "/admin/floorplan",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "floorplan-editor",
          component: () => import("../views/FloorPlanEditorView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_tables",
          },
        },
      ],
    },
    {
      path: "/admin/email-templates",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "email-templates",
          component: () => import("../views/EmailTemplatesView.vue"),
          meta: { standalone: true, requiresAuth: true, requiresAdmin: true },
        },
      ],
    },
    {
      path: "/staff/manage",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "staff-management",
          component: () => import("../views/StaffManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_staff",
          },
        },
      ],
    },
    {
      path: "/roles/manage",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "role-management",
          component: () => import("../views/RoleManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_roles",
          },
        },
      ],
    },
    {
      path: "/groups/manage",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "group-management",
          component: () => import("../views/GroupManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_groups",
          },
        },
      ],
    },
    {
      path: "/waitlist",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "waitlist",
          component: () => import("../views/WaitlistView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_tables",
          },
        },
      ],
    },
    {
      path: "/audit-logs",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "audit-logs",
          component: () => import("../views/AuditLogView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_audit_logs",
          },
        },
      ],
    },
    {
      path: "/search",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "search",
          component: () => import("../views/SearchView.vue"),
          meta: { standalone: true, requiresAuth: true },
        },
      ],
    },
    {
      path: "/menu",
      name: "menu",
      component: () => import("../views/MenuView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/menu/manage",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "menu-management",
          component: () => import("../views/MenuManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_menu",
          },
        },
      ],
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
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "order-dashboard",
          component: () => import("../views/OrderDashboardView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_orders",
          },
        },
      ],
    },
    {
      path: "/deliveries",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "delivery-dashboard",
          component: () => import("../views/DeliveryDashboardView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_orders",
          },
        },
      ],
    },
    {
      path: "/promotions",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "promotions-management",
          component: () => import("../views/PromotionsManagementView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "manage_settings",
          },
        },
      ],
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { standalone: true },
    },
    {
      path: "/payments",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "payments",
          component: () => import("../views/PaymentDashboardView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_reservations",
          },
        },
      ],
    },
    {
      path: "/revenue",
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "revenue-report",
          component: () => import("../views/RevenueReportView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_reservations",
          },
        },
      ],
    },
    {
      path: "/super-admin/customers/:id",
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
      component: () => import("../layouts/TenantLayout.vue"),
      children: [
        {
          path: "",
          name: "no-shows",
          component: () => import("../views/NoShowView.vue"),
          meta: {
            standalone: true,
            requiresAuth: true,
            requiresPermission: "view_reservations",
          },
        },
      ],
    },
    {
      path: "/legal/:slug",
      name: "legal-document",
      component: () => import("../views/legal/LegalDocumentView.vue"),
      meta: { standalone: true },
    },
  ],
});

router.addRoute({
  path: "/super-admin/login",
  name: "super-admin-login",
  component: () => import("../views/admin/SuperAdminLoginView.vue"),
  meta: { standalone: true },
});
router.addRoute({
  path: "/admin",
  redirect: "/super-admin/overview",
});
router.addRoute({
  path: "/admin/",
  redirect: "/super-admin/overview",
});
router.addRoute({
  path: "/admin/:pathMatch(.*)*",
  redirect: "/super-admin/:pathMatch(.*)*",
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
  meta: { standalone: true },
});
router.addRoute({
  path: "/super-admin",
  component: () => import("../layouts/SuperAdminLayout.vue"),
  children: [
    { path: "", redirect: "overview" },
    {
      path: "overview",
      name: "super-admin-overview",
      component: () => import("../views/admin/SuperAdminOverviewView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants",
      name: "tenant-dashboard",
      component: () => import("../views/admin/TenantDashboardView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id",
      name: "tenant-detail",
      component: () => import("../views/admin/TenantDetailView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/api-keys",
      name: "tenant-api-keys",
      component: () => import("../views/admin/ApiKeyManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/branding",
      name: "tenant-branding",
      component: () => import("../views/admin/WhiteLabelBrandingView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/grace-period",
      name: "tenant-grace-period",
      component: () => import("../views/admin/GracePeriodSettingsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/timeline",
      name: "tenant-timeline",
      component: () => import("../views/admin/TenantStatusTimelineView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/notes",
      name: "tenant-notes",
      component: () => import("../views/admin/TenantNotesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/trial",
      name: "tenant-trial",
      component: () => import("../views/admin/TrialManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/invoices",
      name: "tenant-invoices",
      component: () => import("../views/admin/InvoiceManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/onboarding",
      name: "tenant-onboarding",
      component: () => import("../views/admin/OnboardingChecklistView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenants/:id/dsar",
      name: "tenant-dsar",
      component: () => import("../views/admin/DsarManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "plans",
      name: "plans-management",
      component: () => import("../views/admin/PlansManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "payments",
      name: "platform-payment-dashboard",
      component: () => import("../views/admin/PlatformPaymentDashboard.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "usage",
      name: "platform-usage",
      component: () => import("../views/admin/PlatformUsageView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "revenue",
      name: "platform-revenue",
      component: () => import("../views/admin/RevenueReportsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "geographic",
      name: "platform-geographic",
      component: () => import("../views/admin/GeographicDistributionView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "bulk",
      name: "platform-bulk-actions",
      component: () => import("../views/admin/BulkActionsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "financial",
      name: "platform-financial",
      component: () => import("../views/admin/FinancialManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "feature-flags",
      name: "platform-feature-flags",
      component: () => import("../views/admin/FeatureFlagsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "integrations",
      name: "platform-integrations",
      component: () => import("../views/admin/IntegrationAnalyticsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "impersonation",
      name: "platform-impersonation",
      component: () => import("../views/admin/ImpersonationView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "sessions",
      name: "platform-sessions",
      component: () => import("../views/admin/SessionManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "settings",
      name: "platform-settings",
      component: () => import("../views/admin/PlatformSettingsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "settings/totp",
      name: "platform-totp-settings",
      component: () => import("../views/admin/TOTPSettingsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "erpnext",
      name: "platform-erpnext",
      component: () => import("../views/admin/ErpnextAdminView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "security/password-policy",
      name: "platform-password-policy",
      component: () => import("../views/admin/PasswordPolicyView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "analytics",
      name: "platform-analytics",
      component: () => import("../views/admin/AdvancedAnalyticsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "billing-emails",
      name: "billing-email-templates",
      component: () => import("../views/admin/BillingEmailTemplatesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "backups",
      name: "platform-backups",
      component: () => import("../views/admin/BackupManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "alert-rules",
      name: "platform-alert-rules",
      component: () => import("../views/admin/AlertRulesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "penetration-tests",
      name: "platform-penetration-tests",
      component: () => import("../views/admin/PenetrationTestsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "insurance-documents",
      name: "platform-insurance-documents",
      component: () => import("../views/admin/InsuranceDocumentsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "encryption-keys",
      name: "platform-encryption-keys",
      component: () => import("../views/admin/EncryptionKeysView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "auto-scaling",
      name: "platform-auto-scaling",
      component: () => import("../views/admin/AutoScalingTriggersView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "compliance",
      name: "platform-compliance",
      component: () => import("../views/admin/ComplianceEvidenceView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "failover",
      name: "platform-failover",
      component: () => import("../views/admin/FailoverView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "maintenance",
      name: "platform-maintenance",
      component: () => import("../views/admin/MaintenanceModeView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "trust-safety",
      name: "platform-trust-safety",
      component: () => import("../views/admin/TrustSafetyView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "support-tickets",
      name: "platform-support-tickets",
      component: () => import("../views/admin/SupportTicketsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "support-templates",
      name: "platform-support-templates",
      component: () => import("../views/admin/SupportTemplatesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "support-chat",
      name: "platform-support-chat",
      component: () => import("../views/admin/SupportChatView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "monitoring",
      name: "platform-monitoring",
      component: () => import("../views/admin/PerformanceMonitoringView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "monitoring/api-latency",
      name: "platform-api-latency",
      component: () => import("../views/admin/ApiLatencyView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "monitoring/cache",
      name: "platform-cache-stats",
      component: () => import("../views/admin/CacheStatsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "vertical-analytics",
      name: "platform-vertical-analytics",
      component: () => import("../views/admin/VerticalAnalyticsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "vertical-templates",
      name: "platform-vertical-templates",
      component: () => import("../views/admin/VerticalTemplatesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "compliance-rules",
      name: "platform-compliance-rules",
      component: () => import("../views/admin/ComplianceRulesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "notification-templates",
      name: "platform-notification-templates",
      component: () => import("../views/admin/NotificationTemplatesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "announcements",
      name: "platform-announcements",
      component: () => import("../views/admin/AnnouncementsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "data-retention/policies",
      name: "platform-data-retention-policies",
      component: () => import("../views/admin/DataRetentionPoliciesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "data-retention",
      name: "platform-data-retention",
      component: () => import("../views/admin/DataRetentionView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "audit",
      name: "platform-audit-log",
      component: () => import("../views/admin/PlatformAuditLogView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "incidents",
      name: "platform-incidents",
      component: () => import("../views/admin/IncidentManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "suspicious-activity",
      name: "platform-suspicious-activity",
      component: () => import("../views/admin/SuspiciousActivityView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "sub-processors",
      name: "platform-sub-processors",
      component: () => import("../views/admin/SubProcessorsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "platform-reports",
      name: "platform-reports",
      component: () => import("../views/admin/PlatformReportsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "reconciliation",
      name: "platform-reconciliation",
      component: () =>
        import("../views/admin/MultiCurrencyReconciliationView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "paystack",
      name: "platform-paystack",
      component: () => import("../views/admin/PaystackConfigView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "whatsapp-delivery-failures",
      name: "platform-whatsapp-delivery-failures",
      component: () =>
        import("../views/admin/WhatsAppDeliveryFailuresView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "shaqexpress-order-conversion",
      name: "platform-shaqexpress-order-conversion",
      component: () => import("../views/admin/ShaqExpressConversionView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "whatsapp-support-ticket-analytics",
      name: "platform-whatsapp-support-ticket-analytics",
      component: () =>
        import("../views/admin/WhatsAppSupportTicketAnalyticsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "marketplace",
      name: "platform-marketplace",
      component: () => import("../views/admin/MarketplaceListingsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "case-studies",
      name: "platform-case-studies",
      component: () => import("../views/admin/CaseStudiesView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "referrals",
      name: "platform-referrals",
      component: () => import("../views/admin/PlatformReferralsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "tenant-data-export",
      name: "platform-tenant-data-export",
      component: () => import("../views/admin/TenantDataExportView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "cross-tenant-search",
      name: "platform-cross-tenant-search",
      component: () => import("../views/admin/CrossTenantSearchView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "data-anonymization",
      name: "platform-data-anonymization",
      component: () => import("../views/admin/DataAnonymizationView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "platform-roles",
      name: "platform-roles",
      component: () => import("../views/admin/PlatformRoleManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "break-glass",
      name: "break-glass",
      component: () => import("../views/admin/BreakGlassView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "debug",
      name: "platform-debug",
      component: () => import("../views/admin/DebugToolsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "status",
      name: "platform-status",
      component: () => import("../views/admin/SystemStatusView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "migration",
      name: "platform-migration",
      component: () => import("../views/admin/MigrationToolsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "change-management",
      name: "platform-change-management",
      component: () => import("../views/admin/ChangeManagementView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "postmortems",
      name: "platform-postmortems",
      component: () => import("../views/admin/IncidentPostmortemView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "fraud",
      name: "platform-fraud",
      component: () => import("../views/admin/FraudPreventionView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "at-risk-tenants",
      name: "platform-at-risk-tenants",
      component: () => import("../views/admin/AtRiskTenantsView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "notifications",
      name: "platform-notifications",
      component: () => import("../views/admin/NotificationCenterView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
    {
      path: "benchmarks",
      name: "platform-benchmarks",
      component: () => import("../views/admin/BenchmarkView.vue"),
      meta: { requiresAuth: true, requiresPermission: "manage_tenants" },
    },
  ],
});
router.addRoute({
  path: "/onboarding/wizard",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "tenant-setup-wizard",
      component: () => import("../views/TenantSetupWizardView.vue"),
      meta: { standalone: true, requiresAuth: true },
    },
  ],
});
router.addRoute({
  path: "/appointments",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "appointments",
      component: () => import("../views/salon/AppointmentsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/stations",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "stations",
      component: () => import("../views/salon/StationsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_stations",
      },
    },
  ],
});
router.addRoute({
  path: "/station-map",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "station-map",
      component: () => import("../views/salon/StationMapView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/services",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-services",
      component: () => import("../views/salon/ServicesView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_services",
      },
    },
  ],
});
router.addRoute({
  path: "/packages",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-packages",
      component: () => import("../views/salon/SalonPackagesView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_services",
      },
    },
  ],
});
router.addRoute({
  path: "/gift-cards",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-gift-cards",
      component: () => import("../views/salon/SalonGiftCardsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/referrals",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-referrals",
      component: () => import("../views/salon/SalonReferralsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/locations",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-locations",
      component: () => import("../views/salon/SalonLocationsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_tenants",
      },
    },
  ],
});
router.addRoute({
  path: "/inventory",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-inventory",
      component: () => import("../views/salon/SalonInventoryView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/expenses",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-expenses",
      component: () => import("../views/salon/SalonExpensesView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/pricing",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-pricing",
      component: () => import("../views/salon/SalonPricingRulesView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/settings",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-settings",
      component: () => import("../views/salon/SalonSettingsView.vue"),
      meta: { requiresAuth: true, requiresVertical: "salon" },
    },
  ],
});
router.addRoute({
  path: "/salon/walkins",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-walkins",
      component: () => import("../views/salon/SalonWalkInQueueView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/calendar",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-calendar",
      component: () => import("../views/salon/SalonCalendarView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/shifts",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-shifts",
      component: () => import("../views/salon/SalonStaffShiftsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_schedule",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/schedule",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-schedule",
      component: () => import("../views/salon/SalonUnifiedScheduleView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_schedule",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/holidays",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-holidays",
      component: () => import("../views/salon/SalonHolidaysView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_schedule",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/reports",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-reports",
      component: () => import("../views/salon/SalonReportsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/recurring",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-recurring",
      component: () => import("../views/salon/SalonRecurringView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/clients",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-clients",
      component: () => import("../views/salon/SalonClientsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/marketing",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-marketing",
      component: () => import("../views/salon/MarketingCampaignsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_settings",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/gallery",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-gallery",
      component: () => import("../views/salon/SalonGalleryView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_services",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/unified-schedule",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-unified-schedule",
      component: () => import("../views/salon/SalonUnifiedScheduleView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_schedule",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/whatsapp-bookings",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-whatsapp-bookings",
      component: () => import("../views/salon/SalonWhatsAppBookingsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/whatsapp-payments",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-whatsapp-payments",
      component: () => import("../views/salon/SalonWhatsAPPaymentsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/commissions",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-commissions",
      component: () => import("../views/salon/CommissionsView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_commissions",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/dashboard",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-dashboard",
      component: () => import("../views/salon/SalonDashboardView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_appointments",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/cross-location-dashboard",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-cross-location-dashboard",
      component: () => import("../views/salon/CrossLocationDashboardView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "view_reports",
      },
    },
  ],
});
router.addRoute({
  path: "/salon/staff",
  component: () => import("../layouts/TenantLayout.vue"),
  children: [
    {
      path: "",
      name: "salon-staff",
      component: () => import("../views/salon/SalonStaffView.vue"),
      meta: {
        requiresAuth: true,
        requiresVertical: "salon",
        requiresPermission: "manage_staff",
      },
    },
  ],
});

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
    authStore.isAuthenticated &&
    (to.path.startsWith("/super-admin") ||
      (to.path.startsWith("/admin") &&
        !["/admin/settings", "/admin/floorplan", "/admin/email-templates"].some(
          (p) => to.path === p || to.path.startsWith(`${p}/`)
        ))) &&
    !authStore.isSuperAdmin
  ) {
    next({ name: "home" });
  } else if (
    (to.name === "login" ||
      to.name === "super-admin-login" ||
      to.name === "tenant-login" ||
      to.name === "customer-login" ||
      to.name === "customer-register") &&
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
      next({ name: "customer-portal-home" });
    }
  } else if (
    to.name === "home" &&
    authStore.isAuthenticated &&
    !authStore.isLoading
  ) {
    if (authStore.isSuperAdmin) {
      next({ name: "super-admin-overview" });
    } else if (authStore.user?.role === "admin") {
      next({ name: "admin-settings" });
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
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/profile",
    name: "customer-profile",
    component: () => import("../views/customer/CustomerPortalProfileView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/reservations",
    name: "customer-reservations",
    component: () =>
      import("../views/customer/CustomerPortalReservationsView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/reservations",
    name: "customer-reservations",
    component: () =>
      import("../views/customer/CustomerPortalReservationsView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/waitlist",
    name: "customer-waitlist",
    component: () => import("../views/customer/CustomerPortalWaitlistView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/loyalty",
    name: "customer-loyalty",
    component: () => import("../views/customer/CustomerPortalLoyaltyView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/promotions",
    name: "customer-promotions",
    component: () =>
      import("../views/customer/CustomerPortalPromotionsView.vue"),
    meta: { requiresAuth: true, standalone: true },
  },
  {
    path: "/portal/appointments",
    name: "customer-appointments",
    component: () =>
      import("../views/customer/CustomerPortalAppointmentsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon", standalone: true },
  },
  {
    path: "/portal/gift-cards",
    name: "customer-gift-cards",
    component: () =>
      import("../views/customer/CustomerPortalGiftCardsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon", standalone: true },
  },
  {
    path: "/portal/referrals",
    name: "customer-referrals",
    component: () =>
      import("../views/customer/CustomerPortalReferralsView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon", standalone: true },
  },
  {
    path: "/portal/packages",
    name: "customer-packages",
    component: () => import("../views/customer/CustomerPortalPackagesView.vue"),
    meta: { requiresAuth: true, requiresVertical: "salon", standalone: true },
  },
];

customerPortalRoutes.forEach((route) => router.addRoute(route));

router.addRoute({
  path: "/customer/login",
  name: "customer-login",
  component: () => import("../views/CustomerLoginView.vue"),
  meta: { standalone: true },
});

router.addRoute({
  path: "/customer/register/:tenantSlug?",
  name: "customer-register",
  component: () => import("../views/CustomerRegisterView.vue"),
  meta: { standalone: true },
});

router.addRoute({
  path: "/:pathMatch(.*)*",
  name: "notFound",
  component: () => import("../views/NotFoundView.vue"),
  meta: { standalone: true },
});

export default router;

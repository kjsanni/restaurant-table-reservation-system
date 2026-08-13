"use strict";

const DEFAULTS = [
  { key: "password_policy", value: { minLength: 8, requireNumbers: true, requireSymbols: false, requireUppercase: true }, domain: "security", description: "Password complexity requirements for staff users" },
  { key: "brute_force_threshold", value: 5, domain: "security", description: "Max failed login attempts before lockout" },
  { key: "session_timeout_minutes", value: 30, domain: "security", description: "Auto-logout idle timeout in minutes" },
  { key: "ip_allowlist", value: [], domain: "security", description: "Allowed IP ranges for admin access (empty = unrestricted)" },
  { key: "turnstile_enabled", value: false, domain: "security", description: "Enable Cloudflare Turnstile bot protection on public forms" },
  { key: "turnstile_site_key", value: "", domain: "security", description: "Cloudflare Turnstile public site key" },
  { key: "turnstile_secret_key", value: "", domain: "security", description: "Cloudflare Turnstile server-side secret key" },

  { key: "paystack_config", value: {}, domain: "payments", description: "Paystack payment gateway configuration" },
  { key: "payment_grace_period_days", value: 3, domain: "payments", description: "Grace period for failed payment retries" },
  { key: "auto_retry_failed_payments", value: true, domain: "payments", description: "Automatically retry failed payment transactions" },

  { key: "data_retention_policy", value: { customerData: "2 years", reservationData: "1 year", auditLogs: "90 days" }, domain: "compliance", description: "Data retention periods per category" },
  { key: "legal_document_version", value: "1.0.0", domain: "compliance", description: "Current legal document version for acceptance tracking" },
  { key: "dsar_response_sla_days", value: 30, domain: "compliance", description: "DSAR response SLA in days (GDPR/Act 843)" },
  { key: "encryption_at_rest_enabled", value: false, domain: "compliance", description: "Enable encryption at rest for stored PII" },

  { key: "feature_flags", value: {}, domain: "features", description: "Global feature flag configuration" },
  { key: "tenant_mode_enabled", value: true, domain: "features", description: "Enable multi-tenant mode across the platform" },
  { key: "salon_feature_flags", value: {}, domain: "features", description: "Feature flags specific to salon vertical" },
  { key: "salon_module_enabled", value: true, domain: "features", description: "Enable salon vertical module" },

  { key: "maintenance_mode", value: false, domain: "operations", description: "Enable platform-wide maintenance mode" },
  { key: "maintenance_message", value: "Platform maintenance in progress. Please check back soon.", domain: "operations", description: "Public message shown during maintenance mode" },
  { key: "backup_schedule_cron", value: "0 2 * * *", domain: "operations", description: "Cron expression for daily backups at 02:00 UTC" },
  { key: "audit_log_retention_days", value: 90, domain: "operations", description: "Number of days to retain audit logs" },

  { key: "whatsapp_config", value: {}, domain: "integrations", description: "WhatsApp Business API configuration" },
  { key: "shaqexpress_enabled", value: true, domain: "integrations", description: "Enable Shaq Express delivery integration" },
  { key: "notification_channels", value: {}, domain: "integrations", description: "Available notification channel configurations" },
  { key: "africastalking_config", value: {}, domain: "integrations", description: "Africa's Talking SMS/voice gateway configuration" },

  { key: "platform_brand_name", value: "Restaurant Reservation System", domain: "branding", description: "Platform brand name displayed to tenants and customers" },
  { key: "platform_logo_url", value: "", domain: "branding", description: "URL to platform-wide logo asset" },
  { key: "platform_primary_color", value: "#4F46E5", domain: "branding", description: "Primary brand color (hex)" },
  { key: "custom_domain", value: "", domain: "branding", description: "Default custom domain for tenant white-labeling (empty = none)" },

  { key: "global_feature_flags", value: { table_management: true, waitlist: true, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: false, salon_walkins: false, salon_client_profiles: false, salon_whatsapp_booking: false, salon_module_enabled: false, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, domain: "other", description: "Global default feature flags for all tenants" },

  { key: "vertical_onboarding_templates", value: [
    { id: 1, name: "Full Service Restaurant", vertical: "restaurant", description: "Complete table reservations, waitlist, delivery, and takeaway with loyalty program.", defaultSettings: { restaurantType: "full_service", businessVertical: "restaurant" }, defaultServiceModes: ["dine_in", "takeaway", "delivery"], featureFlags: { table_management: true, waitlist: true, staff_scheduling: true, loyalty: true, pos_sync: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 2, name: "Quick Service", vertical: "restaurant", description: "Takeaway and delivery-focused with POS sync enabled.", defaultSettings: { restaurantType: "quick_service", businessVertical: "restaurant" }, defaultServiceModes: ["takeaway", "delivery"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: true }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 3, name: "Cloud Kitchen", vertical: "restaurant", description: "Delivery-only operation optimized for delivery aggregators.", defaultSettings: { restaurantType: "cloud_kitchen", businessVertical: "restaurant" }, defaultServiceModes: ["delivery"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: false, loyalty: true, pos_sync: true }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 4, name: "Dine-In Only", vertical: "restaurant", description: "Traditional restaurant with table reservations and waitlist.", defaultSettings: { restaurantType: "dine_in_only", businessVertical: "restaurant" }, defaultServiceModes: ["dine_in"], featureFlags: { table_management: true, waitlist: true, staff_scheduling: true, loyalty: false, pos_sync: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 5, name: "Cafe", vertical: "restaurant", description: "Casual cafe with dine-in and takeaway service.", defaultSettings: { restaurantType: "cafe", businessVertical: "restaurant" }, defaultServiceModes: ["dine_in", "takeaway"], featureFlags: { table_management: true, waitlist: false, staff_scheduling: true, loyalty: false, pos_sync: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 6, name: "Bar / Lounge", vertical: "restaurant", description: "Bar with reservations, walk-ins, and takeaway.", defaultSettings: { restaurantType: "bar", businessVertical: "restaurant" }, defaultServiceModes: ["dine_in", "takeaway"], featureFlags: { table_management: true, waitlist: true, staff_scheduling: true, loyalty: true, pos_sync: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 7, name: "Hair Dressers Salon", vertical: "salon", description: "Salon specializing in hair cutting, coloring, and styling services.", defaultSettings: { restaurantType: "hair-dressers", businessVertical: "salon" }, defaultServiceModes: ["appointments", "walkins"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: true, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 8, name: "Unisex Barbershop", vertical: "salon", description: "Barbershop serving all genders with haircuts, grooming, and styling.", defaultSettings: { restaurantType: "barbers-unisex", businessVertical: "salon" }, defaultServiceModes: ["appointments", "walkins"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: true, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 9, name: "Men's Barbershop", vertical: "salon", description: "Men's grooming-focused barbershop with classic cuts and shaves.", defaultSettings: { restaurantType: "barbers-male", businessVertical: "salon" }, defaultServiceModes: ["appointments", "walkins"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: true, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 10, name: "Ladies' Barbershop", vertical: "salon", description: "Women's-focused barbershop with precision cuts, color, and treatments.", defaultSettings: { restaurantType: "barbers-female", businessVertical: "salon" }, defaultServiceModes: ["appointments"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: false, pos_sync: false, salon_appointments: true, salon_walkins: false, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 11, name: "Nail Salon", vertical: "salon", description: "Nail care specialist with manicures, pedicures, and nail art.", defaultSettings: { restaurantType: "nail-salon", businessVertical: "salon" }, defaultServiceModes: ["appointments"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: false, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 12, name: "Spa & Wellness", vertical: "salon", description: "Full-service spa with massages, facials, and wellness treatments.", defaultSettings: { restaurantType: "spa", businessVertical: "salon" }, defaultServiceModes: ["appointments"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: false, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
    { id: 13, name: "Dreadlocks & Braids", vertical: "salon", description: "Specialist salon for braiding, dreadlocks, and ethnic hair styling.", defaultSettings: { restaurantType: "dreadlocks", businessVertical: "salon" }, defaultServiceModes: ["appointments"], featureFlags: { table_management: false, waitlist: false, staff_scheduling: true, loyalty: true, pos_sync: false, salon_appointments: true, salon_walkins: false, salon_client_profiles: true, salon_whatsapp_booking: true, erpnext_accounting: false, erpnext_stock: false, erpnext_crm: false, erpnext_hr: false, erpnext_pos: false, erpnext_manufacturing: false }, createdAt: "2026-08-12T00:00:00.000Z" },
  ], domain: "other", description: "Pre-configured vertical onboarding templates for restaurant and salon business types" },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkDelete("settings", { tenantId: null }, {});

    const records = DEFAULTS.map((d) => ({
      key: d.key,
      value: JSON.stringify(d.value),
      description: d.description,
      tenantId: null,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert("settings", records);
    console.log(`[${new Date().toISOString()}] Seeded ${records.length} platform settings across 8 domains`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("settings", { tenantId: null }, {});
  },
};

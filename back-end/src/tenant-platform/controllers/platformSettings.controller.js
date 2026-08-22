const authDAO = require("../../DAOs/auth.dao");
const platformAuditDAO = require("../DAOs/platformAudit.dao");
const auditLog = require("../utils/auditLog");

const DOMAIN_ALLOWLISTS = {
  security: [
    "password_policy",
    "brute_force_threshold",
    "session_timeout_minutes",
    "ip_allowlist",
    "turnstile_enabled",
    "turnstile_site_key",
    "turnstile_secret_key",
  ],
  payments: [
    "paystack_config",
    "payment_grace_period_days",
    "auto_retry_failed_payments",
  ],
  compliance: [
    "data_retention_policy",
    "legal_document_version",
    "dsar_response_sla_days",
    "encryption_at_rest_enabled",
  ],
  features: [
    "feature_flags",
    "tenant_mode_enabled",
    "salon_feature_flags",
    "salon_module_enabled",
  ],
  operations: [
    "maintenance_mode",
    "maintenance_message",
    "backup_schedule_cron",
    "audit_log_retention_days",
  ],
  integrations: [
    "whatsapp_config",
    "shaqexpress_enabled",
    "notification_channels",
    "africastalking_config",
    "erpnext_base_url",
    "erpnext_api_key",
    "erpnext_api_secret",
    "erpnext_timeout_ms",
    "erpnext_cache_ttl",
  ],
  branding: [
    "platform_brand_name",
    "platform_logo_url",
    "platform_primary_color",
    "custom_domain",
  ],
  events: [
    "event_qr_secret",
    "event_checkin_config",
  ],
  other: [
    "vertical_onboarding_templates",
    "global_feature_flags",
  ],
};

const ALLOWLIST = Object.values(DOMAIN_ALLOWLISTS).flat();

const listPlatformSettingsHandler = async (req, res) => {
  const settings = await authDAO.getAllSettings(null);
  const platformSettings = settings.filter((s) => s.tenantId === null);
  const groups = {};
  for (const setting of platformSettings) {
    const key = setting.key;
    let domain = "other";
    for (const [name, keys] of Object.entries(DOMAIN_ALLOWLISTS)) {
      if (keys.includes(key)) {
        domain = name;
        break;
      }
    }
    if (!groups[domain]) groups[domain] = [];
    const SENSITIVE_KEY_PATTERN = /secret|key|password|token/i;
    const EXPLICIT_SENSITIVE_KEYS = new Set([
      "turnstile_secret_key",
      "erpnext_api_secret",
      "password_policy",
    ]);
    const isSensitive = EXPLICIT_SENSITIVE_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key);
    groups[domain].push({
      key: setting.key,
      value: isSensitive ? "[REDACTED]" : setting.value,
      updatedAt: setting.updatedAt,
    });
  }
  res.status(200).json({ success: true, domains: groups });
};

const updatePlatformSettingHandler = async (req, res) => {
  const { key, value } = req.body;
  if (!ALLOWLIST.includes(key)) {
    return res.status(400).json({ success: false, message: "Unknown or protected setting key." });
  }

  const previous = await authDAO.getPlatformSettingByKey(key);
  const updated = await authDAO.updatePlatformSetting(key, value);

  await auditLog(req, "platform_setting.updated", "platform_setting", key, {
    key,
    previousValue: previous?.value,
    newValue: updated.value,
  });

  if (key.startsWith("erpnext_")) {
    const erpnextClient = require("../../integrations/erpnext/client");
    erpnextClient.resetClient();
  }

  res.status(200).json({ success: true, setting: updated });
};

const listPlatformSettingChangesHandler = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 5, 20);
  const entries = await platformAuditDAO.findRecent("platform_setting.updated", limit);
  const changes = entries.map((entry) => ({
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    createdAt: entry.createdAt,
    userId: entry.userId,
  }));
  res.status(200).json({ success: true, collection: changes });
};

module.exports = {
  listPlatformSettingsHandler,
  updatePlatformSettingHandler,
  listPlatformSettingChangesHandler,
};

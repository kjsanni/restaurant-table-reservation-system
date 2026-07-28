<template>
  <div class="platform-settings-view">
    <div class="page-header">
      <div>
        <h1>Platform Settings</h1>
        <p class="subtitle">
          Governance dashboard for platform-wide configuration
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadSettings">Retry</button>
    </div>
    <div v-else class="settings-grid">
      <div class="domain-card turnstile-card">
        <div class="domain-header">
          <h3>Cloudflare Turnstile</h3>
          <span class="domain-count">Bot protection</span>
        </div>
        <div class="domain-items">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-key">Enabled</span>
              <span class="setting-description">
                Protect public forms (login, register, DSAR) from bots
              </span>
            </div>
            <div class="setting-actions">
              <label class="toggle">
                <input
                  v-model="turnstileEnabled"
                  type="checkbox"
                  :disabled="saving"
                  @change="saveTurnstileSettings"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-key">Site Key</span>
              <span class="setting-description">
                Public key for the Turnstile widget
              </span>
            </div>
            <div class="setting-actions">
              <input
                v-model="turnstileSiteKey"
                type="text"
                class="filter-select"
                placeholder="0x4AAAAAAA..."
                :disabled="saving"
                @blur="saveTurnstileSettings"
              />
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-key">Secret Key</span>
              <span class="setting-description">
                Server-side secret for token verification
              </span>
            </div>
            <div class="setting-actions">
              <input
                v-model="turnstileSecretKey"
                type="password"
                class="filter-select"
                placeholder="0x4AAAAAAA..."
                :disabled="saving"
                @blur="saveTurnstileSettings"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-for="(items, domain) in domains" :key="domain" class="domain-card">
        <div class="domain-header">
          <h3>{{ formatDomain(domain) }}</h3>
          <span class="domain-count"
            >{{ items.length }} setting{{ items.length === 1 ? "" : "s" }}</span
          >
        </div>
        <div class="domain-items">
          <div v-for="item in items" :key="item.key" class="setting-row">
            <div class="setting-info">
              <span class="setting-key">{{ formatKey(item.key) }}</span>
              <span v-if="editingKey !== item.key" class="setting-value">{{
                formatValue(item.value)
              }}</span>
              <div v-else class="setting-edit">
                <input
                  v-if="isBooleanSetting(item.key)"
                  v-model="editValue"
                  type="checkbox"
                  class="toggle"
                />
                <input
                  v-else
                  v-model="editValue"
                  type="text"
                  class="filter-select"
                />
              </div>
            </div>
            <div class="setting-actions">
              <span v-if="item.updatedAt" class="setting-time">
                {{ formatDate(item.updatedAt) }}
              </span>
              <template v-if="isInlineEditable(item.key)">
                <template v-if="editingKey === item.key">
                  <button
                    class="btn-xs btn-primary"
                    :disabled="saving"
                    @click="saveSetting(item.key)"
                  >
                    {{ saving ? "Saving..." : "Save" }}
                  </button>
                  <button
                    class="btn-xs btn-secondary"
                    :disabled="saving"
                    @click="cancelEdit"
                  >
                    Cancel
                  </button>
                </template>
                <button
                  v-else
                  class="btn-xs btn-secondary"
                  @click="startEdit(item.key, item.value)"
                >
                  Edit
                </button>
              </template>
              <a
                v-else
                :href="getConfigureLink(item.key)"
                class="btn-xs btn-secondary"
              >
                Configure
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="auditChanges.length" class="audit-section">
      <h3>Recent Platform Setting Changes</h3>
      <div class="audit-list">
        <div v-for="change in auditChanges" :key="change.id" class="audit-item">
          <div class="audit-info">
            <span class="audit-action">{{
              formatAction(change.metadata)
            }}</span>
            <span class="audit-time">{{ formatDate(change.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import { useRouter } from "vue-router";

const router = useRouter();
const domains = ref({});
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const editingKey = ref(null);
const editValue = ref(null);
const auditChanges = ref([]);

const turnstileEnabled = ref(false);
const turnstileSiteKey = ref("");
const turnstileSecretKey = ref("");

const DOMAIN_LABELS = {
  security: "Security Posture",
  payments: "Payment Infrastructure",
  compliance: "Compliance & Legal",
  features: "Feature Governance",
  operations: "Operations",
  integrations: "Integrations",
  branding: "Branding & White-label",
  other: "Other",
};

const INLINE_EDITABLE = new Set([
  "maintenance_mode",
  "tenant_mode_enabled",
  "currency_locale",
]);

const CONFIGURE_LINKS = {
  password_policy: "/super-admin/security/password-policy",
  maintenance_mode: "/admin/settings",
  feature_flags: "/super-admin/feature-flags",
  paystack_config: "/super-admin/paystack",
  data_retention_policy: "/super-admin/data-retention/policies",
  legal_document_version: "/super-admin/legal-documents",
  notification_channels: "/super-admin/notifications/templates",
  salon_feature_flags: "/super-admin/vertical-templates",
};

const isInlineEditable = (key) => INLINE_EDITABLE.has(key);

const isBooleanSetting = (key) => {
  const setting = Object.values(domains.value)
    .flat()
    .find((s) => s.key === key);
  return typeof setting?.value === "boolean";
};

const loadSettings = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminAPI.listPlatformSettings();
    domains.value = res.data?.domains || {};
    await loadTurnstileSettings();
  } catch (e) {
    error.value = "Failed to load platform settings.";
  } finally {
    loading.value = false;
  }
};

const loadTurnstileSettings = async () => {
  try {
    const res = await adminAPI.get("/admin/platform-settings");
    const settings = res.data?.domains?.security || [];
    const findSetting = (key) => settings.find((s) => s.key === key)?.value;

    turnstileEnabled.value = Boolean(findSetting("turnstile_enabled"));
    turnstileSiteKey.value = findSetting("turnstile_site_key") || "";
    turnstileSecretKey.value = findSetting("turnstile_secret_key") || "";
  } catch {
    // keep defaults
  }
};

const startEdit = (key, value) => {
  editingKey.value = key;
  editValue.value = isBooleanSetting(key) ? Boolean(value) : (value ?? "");
};

const cancelEdit = () => {
  editingKey.value = null;
  editValue.value = null;
};

const saveTurnstileSettings = async () => {
  saving.value = true;
  try {
    await adminAPI.updatePlatformSetting(
      "turnstile_enabled",
      turnstileEnabled.value
    );
    await adminAPI.updatePlatformSetting(
      "turnstile_site_key",
      turnstileSiteKey.value
    );
    if (turnstileSecretKey.value) {
      await adminAPI.updatePlatformSetting(
        "turnstile_secret_key",
        turnstileSecretKey.value
      );
    }
    await loadSettings();
  } catch (e) {
    error.value = "Failed to save Turnstile settings.";
  } finally {
    saving.value = false;
  }
};

const saveSetting = async (key) => {
  saving.value = true;
  try {
    await adminAPI.updatePlatformSetting(key, editValue.value);
    await loadSettings();
    editingKey.value = null;
    editValue.value = null;
  } catch (e) {
    error.value = "Failed to save setting.";
  } finally {
    saving.value = false;
  }
};

const getConfigureLink = (key) => {
  return CONFIGURE_LINKS[key] || "/super-admin/overview";
};

const formatDomain = (domain) => {
  return DOMAIN_LABELS[domain] || domain;
};

const formatKey = (key) => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatValue = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

const loadAuditChanges = async () => {
  try {
    const res = await adminAPI.listPlatformSettingChanges();
    auditChanges.value = res.data?.collection || [];
  } catch {
    auditChanges.value = [];
  }
};

const formatAction = (metadata) => {
  if (!metadata) return "Setting updated";
  const { key, previousValue, newValue } = metadata;
  if (!key) return "Setting updated";
  const prev = formatValue(previousValue);
  const next = formatValue(newValue);
  return `${formatKey(key)}: ${prev} → ${next}`;
};

onMounted(() => {
  loadSettings();
  loadAuditChanges();
});
</script>

<style scoped>
.platform-settings-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.error-state {
  text-align: center;
  padding: var(--space-6);
}
.error-state p {
  color: var(--rose-600);
  margin-bottom: var(--space-3);
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-5);
}
.domain-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.domain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.domain-header h3 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.domain-count {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  background: var(--surface-sunken);
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
}
.domain-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  min-width: 0;
  flex: 1;
}
.setting-key {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  word-break: break-word;
}
.setting-value {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  word-break: break-word;
}
.setting-edit {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.setting-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}
.setting-time {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: nowrap;
}
.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
.toggle {
  width: 20px;
  height: 20px;
  accent-color: var(--brand-700);
}
.btn-xs {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-primary {
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--border);
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.audit-section {
  margin-top: var(--space-6);
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.audit-section h3 {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.audit-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.audit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.audit-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
}
.audit-action {
  font-size: var(--text-sm);
  color: var(--ink);
  word-break: break-word;
}
.audit-time {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: nowrap;
}

.turnstile-card {
  border-color: var(--accent-200);
  background: linear-gradient(180deg, var(--surface) 0%, var(--accent-50) 100%);
}
.turnstile-card .domain-header h3 {
  color: var(--accent-900);
}
.setting-description {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-top: var(--space-0-5);
}
.turnstile-card .filter-select {
  width: 240px;
}
</style>

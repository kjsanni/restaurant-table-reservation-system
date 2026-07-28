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
              <span class="setting-value">{{ formatValue(item.value) }}</span>
            </div>
            <div class="setting-meta">
              <span v-if="item.updatedAt" class="setting-time">
                Updated {{ formatDate(item.updatedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const domains = ref({});
const loading = ref(false);
const error = ref(null);

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

const loadSettings = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminAPI.listPlatformSettings();
    domains.value = res.data?.domains || {};
  } catch (e) {
    error.value = "Failed to load platform settings.";
  } finally {
    loading.value = false;
  }
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

onMounted(() => {
  loadSettings();
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
.setting-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-0-5);
  flex-shrink: 0;
}
.setting-time {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  white-space: nowrap;
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

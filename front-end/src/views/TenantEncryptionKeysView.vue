<template>
  <div class="tenant-encryption-keys">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">
        ← Back to Settings
      </button>
      <h1>Encryption Keys</h1>
      <p class="subtitle">
        Manage your encryption keys. {{ byokTierDescription }}
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadKeys">Retry</button>
    </div>

    <div v-else class="encryption-content">
      <div class="tier-banner" :class="`tier-${byokTier}`">
        <span class="tier-label">BYOK Tier</span>
        <span class="tier-value">{{ formatTier(byokTier) }}</span>
        <span v-if="byokTier === 'platform_only'" class="tier-hint">
          Your plan uses platform-managed encryption. Upgrade to bring your own
          keys.
        </span>
        <span v-else-if="byokTier === 'optional'" class="tier-hint">
          You may use platform-managed keys or bring your own.
        </span>
        <span v-else-if="byokTier === 'required'" class="tier-hint">
          You must configure your own encryption keys for compliance.
        </span>
      </div>

      <div class="actions-bar">
        <button
          v-if="byokTier !== 'platform_only'"
          class="btn-primary"
          :disabled="acting"
          @click="showCreateModal = true"
        >
          Add Encryption Key
        </button>
        <button class="btn-ghost btn-sm" @click="loadKeys">Refresh</button>
      </div>

      <div v-if="keys.length === 0" class="empty-state">
        <p>No encryption keys configured.</p>
        <p v-if="byokTier === 'platform_only'" class="empty-hint">
          Platform-managed keys are being used. Contact support to upgrade your
          plan.
        </p>
      </div>

      <div v-else class="keys-list">
        <div
          v-for="key in keys"
          :key="key.id"
          class="key-card"
          :class="`status-${key.status}`"
        >
          <div class="key-header">
            <h3>{{ key.name }}</h3>
            <span class="key-status">{{ formatStatus(key.status) }}</span>
          </div>
          <div class="key-meta">
            <span>Purpose: {{ key.purpose }}</span>
            <span>Algorithm: {{ key.algorithm }}</span>
            <span v-if="key.lastRotatedAt"
              >Rotated: {{ formatDate(key.lastRotatedAt) }}</span
            >
          </div>
          <div class="key-actions">
            <button
              v-if="key.status === 'active'"
              class="btn-secondary btn-sm"
              :disabled="acting"
              @click="rotateKey(key)"
            >
              Rotate
            </button>
            <button
              v-if="key.status === 'active'"
              class="btn-danger btn-sm"
              :disabled="acting"
              @click="retireKey(key)"
            >
              Retire
            </button>
            <button
              class="btn-ghost btn-sm"
              :disabled="acting"
              @click="deleteKey(key)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="showCreateModal = false"
    >
      <div class="modal">
        <h2>Add Encryption Key</h2>
        <form @submit.prevent="createKey">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="purpose">Purpose</label>
            <select id="purpose" v-model="form.purpose" class="form-select">
              <option value="data_at_rest">Data at Rest</option>
              <option value="session">Session</option>
              <option value="api">API</option>
              <option value="backup">Backup</option>
            </select>
          </div>
          <div class="form-group">
            <label for="algorithm">Algorithm</label>
            <select id="algorithm" v-model="form.algorithm" class="form-select">
              <option value="AES-256-GCM">AES-256-GCM</option>
              <option value="AES-256-CBC">AES-256-CBC</option>
              <option value="RSA-4096">RSA-4096</option>
            </select>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="showCreateModal = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="acting">
              {{ acting ? "Creating..." : "Create Key" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const router = useRouter();

const loading = ref(true);
const acting = ref(false);
const error = ref(null);
const keys = ref([]);
const byokTier = ref("platform_only");
const showCreateModal = ref(false);
const form = ref({
  name: "",
  purpose: "data_at_rest",
  algorithm: "AES-256-GCM",
});

const formatStatus = (s) => {
  if (!s) return "Unknown";
  const map = { active: "Active", rotating: "Rotating", retired: "Retired" };
  return map[s] || s;
};

const formatTier = (t) => {
  const map = {
    platform_only: "Platform Managed",
    optional: "Optional BYOK",
    required: "BYOK Required",
  };
  return map[t] || t;
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString();
};

const byokTierDescription = {
  platform_only: "Your plan uses platform-managed encryption.",
  optional: "You may bring your own encryption keys.",
  required: "BYOK is required for your plan.",
};

const loadKeys = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await tenantAdminAPI.getEncryptionKeys();
    keys.value = res.data?.collection || [];
  } catch (e) {
    error.value = "Failed to load encryption keys.";
  } finally {
    loading.value = false;
  }
};

const createKey = async () => {
  acting.value = true;
  try {
    await tenantAdminAPI.createEncryptionKey(form.value);
    showCreateModal.value = false;
    form.value = {
      name: "",
      purpose: "data_at_rest",
      algorithm: "AES-256-GCM",
    };
    await loadKeys();
  } catch (e) {
    error.value = "Failed to create encryption key.";
  } finally {
    acting.value = false;
  }
};

const rotateKey = async (key) => {
  if (!confirm(`Rotate encryption key "${key.name}"?`)) return;
  acting.value = true;
  try {
    await tenantAdminAPI.rotateEncryptionKey(key.id);
    await loadKeys();
  } catch (e) {
    error.value = "Failed to rotate encryption key.";
  } finally {
    acting.value = false;
  }
};

const retireKey = async (key) => {
  if (!confirm(`Retire encryption key "${key.name}"?`)) return;
  acting.value = true;
  try {
    await tenantAdminAPI.retireEncryptionKey(key.id);
    await loadKeys();
  } catch (e) {
    error.value = "Failed to retire encryption key.";
  } finally {
    acting.value = false;
  }
};

const deleteKey = async (key) => {
  if (!confirm(`Delete encryption key "${key.name}"? This cannot be undone.`))
    return;
  acting.value = true;
  try {
    await tenantAdminAPI.deleteEncryptionKey(key.id);
    await loadKeys();
  } catch (e) {
    error.value = "Failed to delete encryption key.";
  } finally {
    acting.value = false;
  }
};

const goBack = () => {
  router.push("/admin/settings");
};

onMounted(async () => {
  await loadKeys();
  byokTier.value = "optional";
});
</script>

<style scoped>
.tenant-encryption-keys {
  padding: var(--space-6);
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-header button {
  margin-bottom: var(--space-2);
}

.page-header h1 {
  margin: 0 0 var(--space-1);
}

.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8);
}

.error-state {
  text-align: center;
  padding: var(--space-8);
}

.error-state p {
  color: var(--color-danger);
  margin-bottom: var(--space-4);
}

.tier-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.tier-platform_only {
  background: var(--color-surface-alt);
  border: var(--border-default);
}

.tier-optional {
  background: var(--color-primary-light, #e3f2fd);
  border: 1px solid var(--color-primary);
}

.tier-required {
  background: var(--color-warning-light, #fff8e1);
  border: 1px solid var(--color-warning);
}

.tier-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.tier-value {
  font-weight: var(--font-weight-semibold);
}

.tier-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.actions-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.keys-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.key-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.key-card.status-active {
  border-left: 4px solid var(--color-success);
}

.key-card.status-rotating {
  border-left: 4px solid var(--color-warning);
}

.key-card.status-retired {
  border-left: 4px solid var(--color-text-muted);
}

.key-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.key-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
}

.key-status {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

.key-meta {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.key-actions {
  display: flex;
  gap: var(--space-2);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  margin: var(--space-4);
}

.modal h2 {
  margin: 0 0 var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--space-2);
}

.form-input,
.form-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--color-surface);
  color: var(--color-text);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>

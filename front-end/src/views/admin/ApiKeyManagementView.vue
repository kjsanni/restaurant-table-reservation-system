<template>
  <div class="api-keys-page">
    <div class="page-header">
      <div>
        <button @click="$router.back()" class="back-btn">← Back</button>
        <h1>API Keys</h1>
        <p class="subtitle">
          Manage API keys for {{ tenant.name || "this tenant" }}
        </p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        + Create API Key
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading API keys...</p>
    </div>

    <div v-else-if="keys.length === 0" class="empty-state">
      <p>No API keys found. Create one to get started.</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="keys-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last 4</th>
            <th>Scopes</th>
            <th>Last Used</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keys" :key="key.id">
            <td>{{ key.name }}</td>
            <td>
              <code>{{ key.last4 }}</code>
            </td>
            <td>
              <span class="scope-list">
                <span
                  v-for="scope in key.scopes"
                  :key="scope"
                  class="scope-badge"
                >
                  {{ scope }}
                </span>
              </span>
            </td>
            <td>{{ formatDate(key.lastUsedAt) }}</td>
            <td>{{ formatDate(key.createdAt) }}</td>
            <td class="actions">
              <button
                @click="revokeKey(key)"
                class="btn-small danger"
                :disabled="key.revoked"
              >
                {{ key.revoked ? "Revoked" : "Revoke" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h2>{{ editingKey ? "Create API Key" : "Create API Key" }}</h2>
        <form @submit.prevent="submitKey">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" required placeholder="e.g. Mobile App" />
          </div>
          <div class="form-group">
            <label>Scopes</label>
            <div class="scope-checks">
              <label
                v-for="scope in availableScopes"
                :key="scope"
                class="scope-check"
              >
                <input type="checkbox" :value="scope" v-model="form.scopes" />
                <span>{{ scope }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Expires In (days)</label>
            <input
              v-model.number="form.expiresInDays"
              type="number"
              min="1"
              placeholder="Leave empty for no expiry"
            />
          </div>
          <div v-if="rawKey" class="raw-key-box">
            <label>Raw Key (save it now)</label>
            <code class="raw-key">{{ rawKey }}</code>
            <button type="button" class="btn-copy" @click="copyKey">
              {{ copied ? "Copied" : "Copy" }}
            </button>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">
              {{ rawKey ? "Close" : "Cancel" }}
            </button>
            <button v-if="!rawKey" type="submit" class="btn-primary">
              Create Key
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useToastStore } from "@/stores/toast";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import apiKeyAPI from "@/services/apiKeyAPI";

const toastStore = useToastStore();

const route = useRoute();
const tenant = ref({ name: "" });
const keys = ref([]);
const loading = ref(true);
const showModal = ref(false);
const editingKey = ref(null);
const rawKey = ref("");
const copied = ref(false);
const availableScopes = ["read", "write", "reservations", "billing"];
const form = ref({
  name: "",
  scopes: [],
  expiresInDays: null,
});

const loadKeys = async () => {
  loading.value = true;
  try {
    const [tenantRes, keysRes] = await Promise.all([
      tenantAdminAPI.getById(route.params.id),
      apiKeyAPI.listApiKeys(route.params.id),
    ]);
    tenant.value = tenantRes.data.item || {};
    keys.value = keysRes.data.collection || keysRes.data.items || [];
  } catch (err) {
    console.error("Failed to load API keys", err);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingKey.value = null;
  form.value = { name: "", scopes: [], expiresInDays: null };
  rawKey.value = "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingKey.value = null;
  rawKey.value = "";
};

const submitKey = async () => {
  try {
    const payload = {
      name: form.value.name,
      scopes: form.value.scopes,
      ...(form.value.expiresInDays
        ? { expiresInDays: Number(form.value.expiresInDays) }
        : {}),
    };
    const response = await apiKeyAPI.createApiKey(route.params.id, payload);
    rawKey.value = response.data.rawKey || response.data.key || "";
    await loadKeys();
  } catch (err) {
    toastStore.add(
      err.response?.data?.message || "Failed to create API key",
      "error",
      4000
    );
  }
};

const revokeKey = async (key) => {
  if (!confirm(`Revoke API key "${key.name}"? This cannot be undone.`)) return;
  try {
    await apiKeyAPI.revokeApiKey(route.params.id, key.id);
    await loadKeys();
  } catch (err) {
    toastStore.add(
      err.response?.data?.message || "Failed to revoke API key",
      "error",
      4000
    );
  }
};

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(rawKey.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // ignore clipboard errors
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadKeys();
});
</script>

<style scoped>
.api-keys-page {
  padding: var(--space-6);
  max-width: 1000px;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}
.page-header > div {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}
.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.back-btn:hover {
  color: var(--accent-600);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: var(--space-1) 0 0 0;
  font-size: var(--text-sm);
}
.loading-state,
.empty-state {
  padding: var(--space-8);
  text-align: center;
  color: var(--ink-muted);
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.keys-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.keys-table th,
.keys-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.keys-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.keys-table tbody tr:hover {
  background: var(--surface-sunken);
}
.keys-table code {
  background: var(--neutral-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: var(--text-xs);
}
.scope-list {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}
.scope-badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--sky-100);
  color: var(--sky-600);
  font-size: var(--text-xs);
  font-weight: 600;
}
.actions {
  display: flex;
  gap: var(--space-2);
}
.btn-small {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-small:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.btn-small.danger {
  background: var(--rose-500);
  color: var(--white);
  border-color: var(--rose-500);
}
.btn-small.danger:hover {
  background: var(--rose-600);
}
.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-primary:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-secondary:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 20, 16, 0.55);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border);
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.scope-checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.scope-check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  cursor: pointer;
}
.raw-key-box {
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.raw-key-box label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--ink);
}
.raw-key {
  display: block;
  word-break: break-all;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--ink);
  margin-bottom: var(--space-3);
}
.btn-copy {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-copy:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>

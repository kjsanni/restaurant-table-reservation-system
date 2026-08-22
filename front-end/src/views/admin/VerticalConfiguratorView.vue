<template>
  <div class="vertical-configurator-view">
    <div class="page-header">
      <div>
        <h1>Vertical Configurator</h1>
        <p class="subtitle">Allocate features and integrations per vertical use case</p>
      </div>
      <button class="btn-primary" @click="openCreateModal" :disabled="!isElevated">
        {{ isElevated ? "New Configuration" : "Requires Break-Glass" }}
      </button>
    </div>

    <div class="breakglass-banner" v-if="!isElevated">
      <span class="breakglass-icon">&#9888;</span>
      <span>Break-glass elevation is required to create or modify vertical configurations.</span>
      <button class="btn-sm btn-primary" @click="goToBreakGlass">Request Elevation</button>
    </div>

    <div class="summary-cards" v-if="summary.length">
      <div v-for="item in summary" :key="item.id" class="summary-card">
        <div class="summary-header">
          <span class="badge" :class="verticalClass(item.vertical)">{{ item.vertical }}</span>
          <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-neutral'">{{ item.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
        <h3>{{ item.name }}</h3>
        <p class="use-case">{{ item.useCaseType }}</p>
        <div class="summary-stats">
          <span>{{ item.featureCount }} features</span>
          <span>{{ item.serviceModeCount }} modes</span>
          <span>{{ item.integrationCount }} integrations</span>
        </div>
      </div>
    </div>

    <div class="filters">
      <select v-model="filterVertical" class="filter-select" @change="load">
        <option value="">All Verticals</option>
        <option value="restaurant">Restaurant</option>
        <option value="salon">Salon</option>
        <option value="event">Event</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No configurations found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Vertical</th>
              <th>Use Case Type</th>
              <th>Features</th>
              <th>Service Modes</th>
              <th>Integrations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="config in items" :key="config.id">
              <td>#{{ config.id }}</td>
              <td>{{ config.name }}</td>
              <td>
                <span class="badge" :class="verticalClass(config.vertical)">
                  {{ config.vertical }}
                </span>
              </td>
              <td>{{ config.useCaseType }}</td>
              <td>{{ featureCount(config) }}</td>
              <td>
                <span v-for="mode in (config.serviceModes || []).slice(0, 3)" :key="mode" class="tag">{{ mode }}</span>
                <span v-if="(config.serviceModes || []).length > 3" class="tag tag-muted">+{{ config.serviceModes.length - 3 }}</span>
              </td>
              <td>{{ (config.allowedIntegrations || []).length }}</td>
              <td>
                <span class="badge" :class="config.isActive ? 'badge-success' : 'badge-neutral'">
                  {{ config.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-sm btn-secondary" @click="viewConfig(config)">
                  View
                </button>
                <button
                  class="btn-sm"
                  @click="editConfig(config)"
                  :disabled="!isElevated"
                  :title="!isElevated ? 'Requires break-glass elevation' : ''"
                >
                  Edit
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeConfig(config)"
                  :disabled="!isElevated"
                  :title="!isElevated ? 'Requires break-glass elevation' : ''"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="selectedConfig" class="modal-overlay" @click.self="selectedConfig = null">
      <div class="modal" style="max-width: 720px">
        <div class="modal-header">
          <h3>{{ selectedConfig.id ? "Edit Configuration" : "New Configuration" }}</h3>
          <button class="btn-close" @click="selectedConfig = null">×</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto">
          <div class="field">
            <label>Vertical</label>
            <select v-model="form.vertical" class="field-input" :disabled="!!selectedConfig.id">
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div class="field">
            <label>Use Case Type</label>
            <input v-model="form.useCaseType" class="field-input" :disabled="!!selectedConfig.id" placeholder="e.g. full_service, quick_service, cafe, bar, hair-dressers" />
          </div>
          <div class="field">
            <label>Display Name</label>
            <input v-model="form.name" class="field-input" placeholder="e.g. Full Service Restaurant" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea v-model="form.description" rows="2" class="field-input" placeholder="Describe this use case configuration"></textarea>
          </div>
          <div class="field">
            <label>Service Modes (comma-separated)</label>
            <input v-model="serviceModesInput" class="field-input" placeholder="e.g. dine_in, takeaway, delivery" />
          </div>
          <div class="field">
            <label>Allowed Integrations (comma-separated)</label>
            <input v-model="integrationsInput" class="field-input" placeholder="e.g. paystack, whatsapp, shaqexpress, erpnext" />
          </div>
          <div class="field">
            <label>Feature Flags (JSON)</label>
            <textarea v-model="featureFlagsInput" rows="6" class="field-input mono" placeholder='e.g. {"table_management":true,"loyalty":false,"waitlist":true}'></textarea>
          </div>
          <div class="field">
            <label>UI Components (JSON)</label>
            <textarea v-model="uiComponentsInput" rows="4" class="field-input mono" placeholder='e.g. {"showFloorPlan":true,"showWaitlist":true}'></textarea>
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.breakglassRequired" />
              Break-glass required for tenant assignment
            </label>
          </div>
          <div class="field">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isActive" />
              Active
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedConfig = null">Cancel</button>
            <button class="btn-primary" @click="save" :disabled="saving">
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="viewingConfig" class="modal-overlay" @click.self="viewingConfig = null">
      <div class="modal" style="max-width: 640px">
        <div class="modal-header">
          <h3>{{ viewingConfig.name }}</h3>
          <button class="btn-close" @click="viewingConfig = null">×</button>
        </div>
        <div class="modal-body">
          <div class="info-row">
            <span class="label">Vertical</span>
            <span class="value"><span class="badge" :class="verticalClass(viewingConfig.vertical)">{{ viewingConfig.vertical }}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Use Case Type</span>
            <span class="value">{{ viewingConfig.useCaseType }}</span>
          </div>
          <div class="info-row">
            <span class="label">Description</span>
            <span class="value">{{ viewingConfig.description || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Service Modes</span>
            <span class="value">
              <span v-for="mode in viewingConfig.serviceModes || []" :key="mode" class="tag">{{ mode }}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Allowed Integrations</span>
            <span class="value">
              <span v-for="int in viewingConfig.allowedIntegrations || []" :key="int" class="tag">{{ int }}</span>
            </span>
          </div>
          <div class="info-row">
            <span class="label">Feature Flags</span>
            <pre class="json-preview">{{ formatJSON(viewingConfig.featureFlags) }}</pre>
          </div>
          <div class="info-row">
            <span class="label">UI Components</span>
            <pre class="json-preview">{{ formatJSON(viewingConfig.uiComponents) }}</pre>
          </div>
          <div class="info-row">
            <span class="label">Breakglass Required</span>
            <span class="value">{{ viewingConfig.breakglassRequired ? "Yes" : "No" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Status</span>
            <span class="value">{{ viewingConfig.isActive ? "Active" : "Inactive" }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="viewingConfig = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";
import { useToastStore } from "@/stores/toast";

const toastStore = useToastStore();
const toast = (msg, type = "info") => toastStore.add(msg, type, 3000);

const loading = ref(false);
const items = ref([]);
const summary = ref([]);
const selectedConfig = ref(null);
const viewingConfig = ref(null);
const saving = ref(false);
const filterVertical = ref("");
const isElevated = ref(false);

const form = ref({
  vertical: "restaurant",
  useCaseType: "",
  name: "",
  description: "",
  featureFlags: {},
  serviceModes: [],
  allowedIntegrations: [],
  uiComponents: {},
  breakglassRequired: true,
  isActive: true,
});

const serviceModesInput = ref("");
const integrationsInput = ref("");
const featureFlagsInput = ref("{}");
const uiComponentsInput = ref("{}");

const parseCommaList = (val) => {
  if (!val || typeof val !== "string") return [];
  return val.split(",").map((s) => s.trim()).filter(Boolean);
};

const parseJSONField = (val) => {
  if (!val || val === "") return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

const featureCount = (config) => {
  return Object.keys(config.featureFlags || {}).length;
};

const formatJSON = (obj) => {
  if (!obj) return "—";
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "—";
  }
};

const verticalClass = (vertical) => {
  if (vertical === "restaurant") return "badge-info";
  if (vertical === "salon") return "badge-success";
  return "badge-warning";
};

const checkElevation = async () => {
  try {
    const res = await adminAPI.listMyBreakGlassRequests({ status: "approved" });
    const requests = res.data?.collection || [];
    isElevated.value = requests.some((r) => new Date(r.elevatedUntil) > new Date());
  } catch {
    isElevated.value = false;
  }
};

const goToBreakGlass = () => {
  window.location.href = "/admin/break-glass";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listVerticalConfigurations({
      vertical: filterVertical.value || undefined,
    });
    items.value = res.data?.collection || [];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const loadSummary = async () => {
  try {
    const res = await adminAPI.getVerticalConfigurationSummary();
    summary.value = res.data?.collection || [];
  } catch {
    summary.value = [];
  }
};

const openCreateModal = () => {
  if (!isElevated.value) return;
  selectedConfig.value = null;
  form.value = {
    vertical: "restaurant",
    useCaseType: "",
    name: "",
    description: "",
    featureFlags: {},
    serviceModes: [],
    allowedIntegrations: [],
    uiComponents: {},
    breakglassRequired: true,
    isActive: true,
  };
  serviceModesInput.value = "";
  integrationsInput.value = "";
  featureFlagsInput.value = "{}";
  uiComponentsInput.value = "{}";
};

const editConfig = (config) => {
  if (!isElevated.value) return;
  selectedConfig.value = config;
  form.value = {
    vertical: config.vertical,
    useCaseType: config.useCaseType,
    name: config.name,
    description: config.description || "",
    featureFlags: config.featureFlags || {},
    serviceModes: config.serviceModes || [],
    allowedIntegrations: config.allowedIntegrations || [],
    uiComponents: config.uiComponents || {},
    breakglassRequired: config.breakglassRequired,
    isActive: config.isActive,
  };
  serviceModesInput.value = (config.serviceModes || []).join(", ");
  integrationsInput.value = (config.allowedIntegrations || []).join(", ");
  featureFlagsInput.value = formatJSON(config.featureFlags || {});
  uiComponentsInput.value = formatJSON(config.uiComponents || {});
};

const viewConfig = (config) => {
  viewingConfig.value = config;
};

const save = async () => {
  if (!form.value.name || !form.value.useCaseType) {
    toast("Name and use case type are required", "error");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      serviceModes: parseCommaList(serviceModesInput.value),
      allowedIntegrations: parseCommaList(integrationsInput.value),
      featureFlags: parseJSONField(featureFlagsInput.value),
      uiComponents: parseJSONField(uiComponentsInput.value),
    };

    if (selectedConfig.value?.id) {
      await adminAPI.updateVerticalConfiguration(selectedConfig.value.id, payload);
      toast("Configuration updated", "success");
    } else {
      await adminAPI.createVerticalConfiguration(payload);
      toast("Configuration created", "success");
    }
    selectedConfig.value = null;
    await load();
    await loadSummary();
  } catch (err) {
    toast(err.response?.data?.message || "Failed to save configuration", "error");
  } finally {
    saving.value = false;
  }
};

const removeConfig = async (config) => {
  if (!confirm(`Delete configuration "${config.name}"?`)) return;
  try {
    await adminAPI.deleteVerticalConfiguration(config.id);
    toast("Configuration deleted", "success");
    await load();
    await loadSummary();
  } catch (err) {
    toast(err.response?.data?.message || "Failed to delete configuration", "error");
  }
};

onMounted(() => {
  load();
  loadSummary();
  checkElevation();
});
</script>

<style scoped>
.vertical-configurator-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
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
.breakglass-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-50);
  border: 1px solid var(--accent-200);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  color: var(--accent-700);
  font-size: var(--text-sm);
}
.breakglass-icon {
  font-size: var(--text-lg);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.summary-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}
.summary-card h3 {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-lg);
  font-weight: 600;
}
.use-case {
  margin: 0 0 var(--space-3) 0;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.summary-stats {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.badge-info {
  background: var(--sky-100);
  color: var(--sky-700);
}
.badge-success {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-warning {
  background: var(--accent-100);
  color: var(--accent-700);
}
.badge-neutral {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--neutral-100);
  color: var(--neutral-700);
  margin-right: 4px;
}
.tag-muted {
  background: var(--neutral-50);
  color: var(--neutral-500);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.modal-header h3 {
  margin: 0;
}
.btn-close {
  background: none;
  border: none;
  font-size: var(--text-xl);
  cursor: pointer;
  color: var(--ink-muted);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-2);
}
.field-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}
textarea.field-input {
  resize: vertical;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.mono {
  font-family: "SF Mono", "Fira Code", "Monaco", "Consolas", "Courier New", monospace;
  font-size: var(--text-xs);
  resize: vertical;
}
.json-preview {
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-family: "SF Mono", "Fira Code", "Monaco", "Consolas", "Courier New", monospace;
  font-size: var(--text-xs);
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
  width: 100%;
  min-height: 40px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.value {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--accent);
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-sm);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-xs);
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-danger {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--danger);
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font-size: var(--text-xs);
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-xs);
}
.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

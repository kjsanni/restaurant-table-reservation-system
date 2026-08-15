<template>
  <div class="vertical-templates-view">
    <div class="page-header">
      <div>
        <h1>Vertical Templates</h1>
        <p class="subtitle">Pre-configured setups per business vertical</p>
      </div>
      <button class="btn-primary" @click="createTemplate">New Template</button>
    </div>

    <div class="filters">
      <select v-model="filterVertical" class="filter-select" @change="load">
        <option value="">All Verticals</option>
        <option value="restaurant">Restaurant</option>
        <option value="salon">Salon</option>
        <option value="event">Event</option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search templates..."
        class="filter-select"
        @input="load"
      />
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No templates found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Vertical</th>
              <th>Description</th>
              <th>Used By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in items" :key="template.id">
              <td>#{{ template.id }}</td>
              <td>{{ template.name }}</td>
              <td>
                <span class="badge" :class="verticalClass(template.vertical)">
                  {{ template.vertical }}
                </span>
              </td>
              <td class="preview-cell">{{ template.description || "—" }}</td>
              <td class="usage-cell">{{ usageCountFor(template.id) || 0 }}</td>
              <td class="actions-cell">
                <button class="btn-sm btn-secondary" @click="preview(template)">
                  Preview
                </button>
                <button
                  class="btn-sm btn-secondary"
                  @click="applyToTenant(template)"
                  title="Apply template to tenant"
                >
                  Apply
                </button>
                <button
                  class="btn-sm btn-secondary"
                  @click="cloneTemplate(template)"
                  :disabled="tryingClone"
                  title="Clone template"
                >
                  Clone
                </button>
                <button class="btn-sm" @click="editTemplate(template)">
                  Edit
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="removeTemplate(template.id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="usage-section" v-if="usageSummary.length > 0">
      <h2>Template Usage Analytics</h2>
      <div class="usage-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>Template</th>
              <th>Vertical</th>
              <th>Applied To</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in usageSummary" :key="stat.templateId">
              <td>{{ stat.templateName }}</td>
              <td>
                <span class="badge" :class="verticalClass(stat.vertical)">
                  {{ stat.vertical }}
                </span>
              </td>
              <td>{{ stat.usageCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedTemplate"
      class="modal-overlay"
      @click.self="selectedTemplate = null"
    >
      <div class="modal" style="max-width: 720px">
        <div class="modal-header">
          <h3>{{ selectedTemplate.id ? "Edit Template" : "New Template" }}</h3>
          <button class="btn-close" @click="selectedTemplate = null">×</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Vertical</label>
            <select v-model="form.vertical" class="field-input">
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="field-input"
            ></textarea>
          </div>
          <div class="field">
            <label>Default Service Modes</label>
            <div class="checkbox-group">
              <label
                v-for="mode in serviceModeOptions"
                :key="mode"
                class="checkbox-label"
              >
                <input
                  type="checkbox"
                  :value="mode"
                  v-model="form.defaultServiceModes"
                />
                {{ mode }}
              </label>
            </div>
          </div>
          <div class="field">
            <label>Default Settings (JSON)</label>
            <textarea
              v-model="form.defaultSettings"
              rows="4"
              class="field-input mono"
              placeholder='e.g. {"restaurantType":"full_service","businessVertical":"restaurant"}'
            ></textarea>
          </div>
          <div class="field">
            <label>Feature Flags (JSON)</label>
            <textarea
              v-model="form.featureFlags"
              rows="6"
              class="field-input mono"
              placeholder='e.g. {"table_management":true,"loyalty":false}'
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="selectedTemplate = null">
              Cancel
            </button>
            <button class="btn-primary" @click="save" :disabled="saving">
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="previewTemplate"
      class="modal-overlay"
      @click.self="previewTemplate = null"
    >
      <div class="modal" style="max-width: 600px">
        <div class="modal-header">
          <h3>Template Preview: {{ previewTemplate.name }}</h3>
          <button class="btn-close" @click="previewTemplate = null">×</button>
        </div>
        <div class="modal-body">
          <div class="info-row">
            <span class="label">Vertical</span>
            <span class="value">{{ previewTemplate.vertical }}</span>
          </div>
          <div class="info-row">
            <span class="label">Description</span>
            <span class="value">{{ previewTemplate.description || "—" }}</span>
          </div>
          <div class="info-row">
            <span class="label">Service Modes</span>
            <span class="value">
              <span
                v-for="mode in previewTemplate.defaultServiceModes || []"
                :key="mode"
                class="tag"
                >{{ mode }}</span
              >
            </span>
          </div>
          <div class="info-row">
            <span class="label">Default Settings</span>
            <pre class="json-preview">{{
              formatJSON(previewTemplate.defaultSettings)
            }}</pre>
          </div>
          <div class="info-row">
            <span class="label">Feature Flags</span>
            <pre class="json-preview">{{
              formatJSON(previewTemplate.featureFlags)
            }}</pre>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="previewTemplate = null">
            Close
          </button>
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

const parseJSONField = (val) => {
  if (!val || val === "") return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
};

const loading = ref(false);
const items = ref([]);
const selectedTemplate = ref(null);
const previewTemplate = ref(null);
const saving = ref(false);
const tryingClone = ref(false);
const filterVertical = ref("");
const searchQuery = ref("");
const usageLoading = ref(false);
const usageItems = ref([]);
const usageSummary = ref([]);
const form = ref({
  name: "",
  vertical: "restaurant",
  description: "",
  defaultSettings: {},
  defaultServiceModes: [],
  featureFlags: {},
});

const serviceModeOptions = [
  "dine_in",
  "takeaway",
  "delivery",
  "appointments",
  "walkins",
];

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

const preview = (template) => {
  previewTemplate.value = template;
};

const usageCountFor = (templateId) => {
  const stat = usageSummary.value.find((s) => s.templateId === templateId);
  return stat?.usageCount || 0;
};

const applyToTenant = async (template) => {
  const tenantId = prompt("Enter tenant ID to apply this template to:");
  if (!tenantId) return;
  try {
    const settings = template.defaultSettings || {};
    const featureFlags = template.featureFlags || {};
    const serviceModes = template.defaultServiceModes || [];
    const updateData = {};
    if (settings.businessVertical)
      updateData.businessVertical = settings.businessVertical;
    if (settings.restaurantType)
      updateData.restaurantType = settings.restaurantType;
    if (serviceModes.length) updateData.serviceModes = serviceModes;
    if (Object.keys(featureFlags).length) {
      updateData.settings = { featureFlags };
    }
    await adminAPI.patch(`/admin/tenants/${tenantId}`, updateData);
    toast("Template applied to tenant", "success");
  } catch (err) {
    toast(err.response?.data?.message || "Failed to apply template", "error");
  }
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listVerticalTemplates();
    let data = res.data?.collection || [];
    if (filterVertical.value) {
      data = data.filter((t) => t.vertical === filterVertical.value);
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    items.value = data;
  } finally {
    loading.value = false;
  }
};

const editTemplate = (template) => {
  selectedTemplate.value = template;
  form.value = {
    name: template.name,
    vertical: template.vertical,
    description: template.description || "",
    defaultSettings:
      typeof template.defaultSettings === "string"
        ? template.defaultSettings
        : JSON.stringify(template.defaultSettings || {}, null, 2),
    defaultServiceModes: template.defaultServiceModes || [],
    featureFlags:
      typeof template.featureFlags === "string"
        ? template.featureFlags
        : JSON.stringify(template.featureFlags || {}, null, 2),
  };
};

const createTemplate = () => {
  selectedTemplate.value = {};
  form.value = {
    name: "",
    vertical: "restaurant",
    description: "",
    defaultSettings: "{}",
    defaultServiceModes: [],
    featureFlags: "{}",
  };
};

const save = async () => {
  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      vertical: form.value.vertical,
      description: form.value.description,
      defaultSettings: parseJSONField(form.value.defaultSettings),
      defaultServiceModes: form.value.defaultServiceModes,
      featureFlags: parseJSONField(form.value.featureFlags),
    };
    if (selectedTemplate.value?.id) {
      await adminAPI.updateVerticalTemplate(selectedTemplate.value.id, payload);
    } else {
      await adminAPI.createVerticalTemplate(payload);
    }
    selectedTemplate.value = null;
    form.value = {
      name: "",
      vertical: "restaurant",
      description: "",
      defaultSettings: "{}",
      defaultServiceModes: [],
      featureFlags: "{}",
    };
    await load();
  } finally {
    saving.value = false;
  }
};

const removeTemplate = async (id) => {
  if (!confirm("Delete this template?")) return;
  await adminAPI.deleteVerticalTemplate(id);
  await load();
};

const cloneTemplate = async (template) => {
  tryingClone.value = true;
  try {
    await adminAPI.cloneVerticalTemplate(template.id);
    toast(`Cloned "${template.name}" into a new template`, "success");
    await load();
  } catch (err) {
    toast(err.response?.data?.message || "Failed to clone template", "error");
  } finally {
    tryingClone.value = false;
  }
};

const loadUsage = async () => {
  usageLoading.value = true;
  try {
    const res = await adminAPI.getVerticalTemplateUsage();
    usageSummary.value = res.data?.summary || [];
    usageItems.value = res.data?.collection || [];
  } catch (err) {
    console.error("Failed to load template usage", err);
  } finally {
    usageLoading.value = false;
  }
};

onMounted(() => {
  load();
  loadUsage();
});
</script>

<style scoped>
.vertical-templates-view {
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
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
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

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  font-size: var(--text-sm);
  cursor: pointer;
}

.checkbox-label input {
  accent-color: var(--brand-600);
}

.mono {
  font-family:
    "SF Mono", "Fira Code", "Monaco", "Consolas", "Courier New", monospace;
  font-size: var(--text-xs);
  resize: vertical;
}

.json-preview {
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-family:
    "SF Mono", "Fira Code", "Monaco", "Consolas", "Courier New", monospace;
  font-size: var(--text-xs);
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
  width: 100%;
  min-height: 40px;
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
  to {
    transform: rotate(360deg);
  }
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
.preview-cell {
  max-width: 320px;
  color: var(--ink-muted);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
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
.btn-danger {
  border-color: var(--rose-300);
  color: var(--rose-700);
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
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
</style>

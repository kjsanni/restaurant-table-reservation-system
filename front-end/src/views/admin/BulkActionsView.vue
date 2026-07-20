<template>
  <div class="bulk-view">
    <div class="page-header">
      <div>
        <h1>Bulk Actions</h1>
        <p class="subtitle">Perform bulk operations across multiple tenants</p>
      </div>
    </div>

    <div class="bulk-card">
      <div class="bulk-header">
        <h2>Select Tenants</h2>
        <div class="bulk-header-actions">
          <button @click="selectAll" class="btn-small">Select All</button>
          <button @click="clearSelection" class="btn-small">Clear</button>
        </div>
      </div>

      <div class="search-row">
        <input
          v-model="searchQuery"
          placeholder="Search tenants..."
          class="search-input"
        />
      </div>

      <div class="tenant-grid">
        <label
          v-for="tenant in filteredTenants"
          :key="tenant.id"
          :class="[
            'tenant-option',
            { selected: selectedTenants.includes(tenant.id) },
          ]"
        >
          <input type="checkbox" :value="tenant.id" v-model="selectedTenants" />
          <div class="tenant-option-info">
            <span class="tenant-option-name">{{ tenant.name }}</span>
            <span class="tenant-option-meta"
              >{{ tenant.plan }} · {{ tenant.status }}</span
            >
          </div>
        </label>
      </div>

      <div v-if="!filteredTenants.length" class="empty-state">
        <p>No tenants found.</p>
      </div>

      <div class="selection-bar" v-if="selectedTenants.length">
        <span class="selection-count"
          >{{ selectedTenants.length }} tenant{{
            selectedTenants.length > 1 ? "s" : ""
          }}
          selected</span
        >
      </div>
    </div>

    <div class="actions-grid">
      <div class="action-card">
        <h3>Bulk Suspend</h3>
        <p class="action-desc">Suspend selected tenants immediately.</p>
        <button
          :disabled="!selectedTenants.length || actionLoading.suspend"
          class="btn-danger"
          @click="handleBulkSuspend"
        >
          {{ actionLoading.suspend ? "Suspending..." : "Bulk Suspend" }}
        </button>
      </div>

      <div class="action-card">
        <h3>Bulk Change Plan</h3>
        <p class="action-desc">Move selected tenants to another plan.</p>
        <select
          v-model="bulkPlan"
          class="filter-select"
          :disabled="!selectedTenants.length || actionLoading.plan"
        >
          <option value="">Select a plan</option>
          <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
            {{ plan.name }} — {{ plan.currency }} {{ plan.price }} / mo
          </option>
        </select>
        <button
          :disabled="!selectedTenants.length || !bulkPlan || actionLoading.plan"
          class="btn-primary"
          @click="handleBulkChangePlan"
          style="margin-top: var(--space-3)"
        >
          {{ actionLoading.plan ? "Updating..." : "Change Plan" }}
        </button>
      </div>

      <div class="action-card">
        <h3>Bulk Send Email</h3>
        <p class="action-desc">Send an email to all selected tenants.</p>
        <div class="form-group">
          <input
            v-model="emailSubject"
            placeholder="Subject"
            class="filter-select"
            :disabled="!selectedTenants.length || actionLoading.email"
          />
        </div>
        <div class="form-group">
          <textarea
            v-model="emailBody"
            placeholder="Message body..."
            rows="3"
            class="filter-select"
            :disabled="!selectedTenants.length || actionLoading.email"
          ></textarea>
        </div>
        <button
          :disabled="
            !selectedTenants.length ||
            !emailSubject.trim() ||
            !emailBody.trim() ||
            actionLoading.email
          "
          class="btn-primary"
          @click="handleBulkSendEmail"
        >
          {{ actionLoading.email ? "Sending..." : "Send Email" }}
        </button>
      </div>
    </div>

    <div v-if="resultMessage" :class="['result-banner', resultType]">
      {{ resultMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import bulkAPI from "@/services/bulkAPI";
import planAPI from "@/services/planAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const tenants = ref([]);
const plans = ref([]);
const searchQuery = ref("");
const selectedTenants = ref([]);
const bulkPlan = ref("");
const emailSubject = ref("");
const emailBody = ref("");
const actionLoading = ref({ suspend: false, plan: false, email: false });
const resultMessage = ref("");
const resultType = ref("");

const filteredTenants = computed(() => {
  return tenants.value.filter((t) => {
    const q = searchQuery.value.toLowerCase();
    return (
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q)
    );
  });
});

const loadTenants = async () => {
  try {
    const response = await tenantAdminAPI.getAll();
    tenants.value = response.data.collection || response.data || [];
  } catch {
    tenants.value = [];
  }
};

const loadPlans = async () => {
  try {
    const response = await planAPI.listPlans();
    plans.value = response.data.collection || [];
  } catch {
    plans.value = [];
  }
};

const selectAll = () => {
  selectedTenants.value = filteredTenants.value.map((t) => t.id);
};

const clearSelection = () => {
  selectedTenants.value = [];
};

const setResult = (message, type = "success") => {
  resultMessage.value = message;
  resultType.value = type;
};

const handleBulkSuspend = async () => {
  const reason = prompt("Reason for suspending selected tenants:");
  if (!reason) return;
  actionLoading.value.suspend = true;
  resultMessage.value = "";
  try {
    await bulkAPI.bulkSuspend(selectedTenants.value, reason);
    setResult(
      `Successfully suspended ${selectedTenants.value.length} tenant(s).`
    );
    selectedTenants.value = [];
    await loadTenants();
  } catch (err) {
    setResult(
      err.response?.data?.message || "Failed to suspend tenants.",
      "error"
    );
  } finally {
    actionLoading.value.suspend = false;
  }
};

const handleBulkChangePlan = async () => {
  actionLoading.value.plan = true;
  resultMessage.value = "";
  try {
    await bulkAPI.bulkChangePlan(selectedTenants.value, bulkPlan.value);
    const planName =
      plans.value.find((p) => p.slug === bulkPlan.value)?.name ||
      bulkPlan.value;
    setResult(
      `Successfully changed ${selectedTenants.value.length} tenant(s) to ${planName}.`
    );
    selectedTenants.value = [];
    bulkPlan.value = "";
    await loadTenants();
  } catch (err) {
    setResult(err.response?.data?.message || "Failed to change plan.", "error");
  } finally {
    actionLoading.value.plan = false;
  }
};

const handleBulkSendEmail = async () => {
  actionLoading.value.email = true;
  resultMessage.value = "";
  try {
    await bulkAPI.bulkSendEmail(
      selectedTenants.value,
      emailSubject.value,
      emailBody.value
    );
    setResult(`Email sent to ${selectedTenants.value.length} tenant(s).`);
    emailSubject.value = "";
    emailBody.value = "";
  } catch (err) {
    setResult(err.response?.data?.message || "Failed to send email.", "error");
  } finally {
    actionLoading.value.email = false;
  }
};

onMounted(() => {
  loadTenants();
  loadPlans();
});
</script>

<style scoped>
.bulk-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.bulk-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-5);
}
.bulk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.bulk-header h2 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.bulk-header-actions {
  display: flex;
  gap: var(--space-2);
}
.search-row {
  margin-bottom: var(--space-4);
}
.search-input {
  width: 100%;
  max-width: 320px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.tenant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-3);
}
.tenant-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}
.tenant-option:hover {
  border-color: var(--accent);
  background: var(--surface-sunken);
}
.tenant-option.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.tenant-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}
.tenant-option-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
}
.tenant-option-name {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}
.tenant-option-meta {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.selection-bar {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: var(--radius-lg);
  color: var(--accent-600);
  font-weight: 600;
  font-size: var(--text-sm);
}
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.action-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.action-card h3 {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.action-desc {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
textarea.filter-select {
  resize: vertical;
  min-height: 80px;
}
.form-group {
  margin-bottom: var(--space-3);
}
.btn-primary {
  width: 100%;
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
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-danger {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: var(--rose-500);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-danger:hover:not(:disabled) {
  background: var(--rose-600);
  box-shadow: var(--shadow-md);
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.result-banner {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
}
.result-banner.success {
  background: var(--earth-100);
  color: var(--earth-600);
  border: 1px solid var(--earth-200);
}
.result-banner.error {
  background: var(--rose-100);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>

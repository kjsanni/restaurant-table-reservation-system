<template>
  <div class="bulk-view">
    <div class="page-header">
      <div>
        <h1>Bulk Actions</h1>
        <p class="subtitle">Perform bulk operations across multiple tenants</p>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-state"
      aria-busy="true"
      aria-label="Loading tenants"
    >
      <div class="spinner"></div>
      <p>Loading tenants…</p>
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="toolbar-left">
          <label class="select-all-label">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="toggleSelectAll"
            />
            <span>Select all</span>
          </label>
          <span v-if="selectedTenants.length" class="selection-count">
            {{ selectedTenants.length }} selected
          </span>
        </div>
        <div class="toolbar-right">
          <div class="search-input-wrapper">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search venues..."
              class="search-input"
              aria-label="Search tenants"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="search-input-clear"
              aria-label="Clear search"
            >
              ×
            </button>
          </div>
          <select
            v-model="filterStatus"
            class="filter-select"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
            <option value="trialing">Trialing</option>
          </select>
          <button
            v-if="selectedTenants.length"
            @click="clearSelection"
            class="btn-small"
            type="button"
          >
            Clear selection
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <div class="table-inner">
          <table class="tenant-table">
            <caption class="sr-only">
              Select tenants and apply bulk operations
            </caption>
            <thead>
              <tr>
                <th class="checkbox-cell" scope="col" aria-label="Select row">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="toggleSelectAll"
                    aria-label="Select all tenants"
                  />
                </th>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Plan</th>
                <th scope="col">Vertical</th>
                <th scope="col">Status</th>
                <th scope="col">Subscription</th>
                <th scope="col">Next billing</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tenant in filteredTenants" :key="tenant.id">
                <td class="checkbox-cell">
                  <input
                    type="checkbox"
                    :value="tenant.id"
                    v-model="selectedTenants"
                    aria-label="Select tenant"
                  />
                </td>
                <td>{{ tenant.name }}</td>
                <td class="mono">{{ tenant.slug }}</td>
                <td>{{ tenant.plan }}</td>
                <td>{{ tenant.businessVertical || "—" }}</td>
                <td>
                  <span class="status-chip" :class="statusClass(tenant.status)">
                    {{ tenant.status || "—" }}
                  </span>
                </td>
                <td>{{ tenant.subscriptionStatus || "—" }}</td>
                <td>{{ formatDate(tenant.currentPeriodEnd) }}</td>
              </tr>
              <tr v-if="!filteredTenants.length">
                <td colspan="8" class="empty-row">No tenants found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="actions-panel" v-if="selectedTenants.length">
        <section class="action-group">
          <h3 class="action-group-title">Lifecycle</h3>
          <div class="action-row">
            <button
              :disabled="actionLoading.suspend"
              class="btn-danger"
              @click="handleBulkSuspend"
              type="button"
            >
              {{ actionLoading.suspend ? "Suspending…" : "Bulk suspend" }}
            </button>
            <button
              :disabled="actionLoading.enable"
              class="btn-primary"
              @click="handleBulkEnable"
              type="button"
            >
              {{ actionLoading.enable ? "Enabling…" : "Bulk enable" }}
            </button>
            <button
              :disabled="actionLoading.delete"
              class="btn-danger"
              @click="handleBulkDelete"
              type="button"
            >
              {{ actionLoading.delete ? "Deleting…" : "Bulk delete" }}
            </button>
          </div>
        </section>

        <section class="action-group">
          <h3 class="action-group-title">Billing</h3>
          <div class="action-row">
            <select
              v-model="bulkPlan"
              class="filter-select"
              :disabled="actionLoading.plan"
              aria-label="Select plan"
            >
              <option value="">Select a plan</option>
              <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
                {{ plan.name }} — {{ plan.currency }} {{ plan.price }} / mo
              </option>
            </select>
            <button
              :disabled="!bulkPlan || actionLoading.plan"
              class="btn-primary"
              @click="handleBulkChangePlan"
              type="button"
            >
              {{ actionLoading.plan ? "Updating…" : "Change plan" }}
            </button>
          </div>
        </section>

        <section class="action-group">
          <h3 class="action-group-title">Communication</h3>
          <div class="action-row">
            <input
              v-model="emailSubject"
              type="text"
              placeholder="Subject"
              class="filter-select"
              :disabled="actionLoading.email"
              aria-label="Email subject"
            />
            <textarea
              v-model="emailBody"
              placeholder="Message body"
              rows="3"
              class="filter-select"
              :disabled="actionLoading.email"
              aria-label="Email body"
            ></textarea>
            <button
              :disabled="
                !emailSubject.trim() || !emailBody.trim() || actionLoading.email
              "
              class="btn-primary"
              @click="handleBulkSendEmail"
              type="button"
            >
              {{ actionLoading.email ? "Sending…" : "Send email" }}
            </button>
          </div>
        </section>

        <section class="action-group">
          <h3 class="action-group-title">Data</h3>
          <div class="action-row">
            <button
              :disabled="actionLoading.export"
              class="btn-secondary"
              @click="handleBulkExport"
              type="button"
            >
              {{ actionLoading.export ? "Exporting…" : "Export tenants" }}
            </button>
          </div>
        </section>
      </div>

      <div
        v-if="resultMessage"
        :class="['result-banner', resultType]"
        role="status"
      >
        {{ resultMessage }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, computed, onMounted } from "vue";
import bulkAPI from "@/services/bulkAPI";
import planAPI from "@/services/planAPI";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const loading = ref(true);
const tenants = ref([]);
const plans = ref([]);
const searchQuery = ref("");
const filterStatus = ref("");
const selectedTenants = ref([]);
const bulkPlan = ref("");
const emailSubject = ref("");
const emailBody = ref("");
const actionLoading = ref({
  suspend: false,
  plan: false,
  email: false,
  enable: false,
  export: false,
  delete: false,
});
const resultMessage = ref("");
const resultType = ref("");

const filteredTenants = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return tenants.value.filter((t) => {
    const matchesQuery =
      !q ||
      t.name?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q);
    const matchesStatus =
      !filterStatus.value || t.status === filterStatus.value;
    return matchesQuery && matchesStatus;
  });
});

const isAllSelected = computed(() => {
  return (
    filteredTenants.value.length > 0 &&
    selectedTenants.value.length === filteredTenants.value.length
  );
});

const isIndeterminate = computed(() => {
  const count = selectedTenants.value.length;
  return count > 0 && count < filteredTenants.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedTenants.value = [];
  } else {
    selectedTenants.value = filteredTenants.value.map((t) => t.id);
  }
};

const loadTenants = async () => {
  try {
    const response = await tenantAdminAPI.getAll();
    tenants.value = response.data.collection || response.data || [];
  } catch {
    tenants.value = [];
  } finally {
    loading.value = false;
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

const clearSelection = () => {
  selectedTenants.value = [];
  resultMessage.value = "";
};

const setResult = (message, type = "success") => {
  resultMessage.value = message;
  resultType.value = type;
};

const statusClass = (status) => {
  const map = {
    active: "status-ok",
    suspended: "status-bad",
    past_due: "status-warn",
    cancelled: "status-muted",
    trialing: "status-info",
  };
  return map[status] || "status-muted";
};

const handleBulkSuspend = async () => {
  if (!confirm(`Suspend ${selectedTenants.value.length} selected tenant(s)?`))
    return;
  const reason =
    prompt("Reason for suspending selected tenants (optional):") || "";
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
  if (
    !confirm(
      `Change plan for ${selectedTenants.value.length} selected tenant(s)?`
    )
  )
    return;
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
  if (
    !confirm(
      `Send email to ${selectedTenants.value.length} selected tenant(s)?`
    )
  )
    return;
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

const handleBulkEnable = async () => {
  if (!confirm(`Re-enable ${selectedTenants.value.length} selected tenant(s)?`))
    return;
  actionLoading.value.enable = true;
  resultMessage.value = "";
  try {
    await bulkAPI.bulkEnable(selectedTenants.value);
    setResult(
      `Successfully re-enabled ${selectedTenants.value.length} tenant(s).`
    );
    selectedTenants.value = [];
    await loadTenants();
  } catch (err) {
    setResult(
      err.response?.data?.message || "Failed to enable tenants.",
      "error"
    );
  } finally {
    actionLoading.value.enable = false;
  }
};

const handleBulkExport = async () => {
  actionLoading.value.export = true;
  resultMessage.value = "";
  try {
    const response = await bulkAPI.bulkExport(selectedTenants.value);
    const data = response.data?.collection || [];
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setResult(`Exported ${data.length} tenant(s).`);
  } catch (err) {
    setResult(
      err.response?.data?.message || "Failed to export tenants.",
      "error"
    );
  } finally {
    actionLoading.value.export = false;
  }
};

const handleBulkDelete = async () => {
  if (
    !confirm(
      `Cancel (soft delete) ${selectedTenants.value.length} selected tenant(s)? This cannot be undone.`
    )
  )
    return;
  actionLoading.value.delete = true;
  resultMessage.value = "";
  try {
    await bulkAPI.bulkDelete(selectedTenants.value);
    setResult(
      `Successfully cancelled ${selectedTenants.value.length} tenant(s).`
    );
    selectedTenants.value = [];
    await loadTenants();
  } catch (err) {
    setResult(
      err.response?.data?.message || "Failed to delete tenants.",
      "error"
    );
  } finally {
    actionLoading.value.delete = false;
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.select-all-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  cursor: pointer;
}
.selection-count {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-600);
}
.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.table-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  margin-bottom: var(--space-5);
}
.table-inner {
  display: inline-block;
  min-width: 100%;
  vertical-align: middle;
}
.tenant-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.tenant-table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink-muted);
  font-weight: 600;
  white-space: nowrap;
}
.tenant-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--ink);
}
.tenant-table tbody tr:hover {
  background: var(--surface-sunken);
}
.tenant-table .checkbox-cell {
  width: 40px;
  text-align: center;
}
.tenant-table .mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.empty-row {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-6);
}
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
  border: 1px solid transparent;
}
.status-ok {
  background: var(--earth-100);
  color: var(--earth-600);
  border-color: var(--earth-200);
}
.status-bad {
  background: var(--rose-100);
  color: var(--rose-600);
  border-color: var(--rose-200);
}
.status-warn {
  background: var(--accent-100);
  color: var(--accent-600);
  border-color: var(--accent-200);
}
.status-muted {
  background: var(--neutral-100);
  color: var(--neutral-700);
  border-color: var(--neutral-200);
}
.status-info {
  background: var(--sky-100);
  color: var(--sky-600);
  border-color: var(--sky-200);
}
.actions-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.action-group {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.action-group-title {
  margin: 0 0 var(--space-3) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.action-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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
</style>

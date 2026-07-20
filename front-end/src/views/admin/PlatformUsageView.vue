<template>
  <div class="usage-view">
    <div class="page-header">
      <div>
        <h1>Platform Usage</h1>
        <p class="subtitle">
          Monitor tenant resource usage against plan limits
        </p>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Total Tenants</div>
        <div class="card-value">{{ summary.totalTenants }}</div>
      </div>
      <div class="card">
        <div class="card-label">Warnings</div>
        <div class="card-value warning">{{ summary.warningsCount }}</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Tables Usage</div>
        <div class="card-value">{{ summary.avgTablesUsage }}%</div>
      </div>
      <div class="card">
        <div class="card-label">Avg Reservations Usage</div>
        <div class="card-value">{{ summary.avgReservationsUsage }}%</div>
      </div>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search tenants..."
        class="search-input"
      />
      <select v-model="filterPlan" class="filter-select">
        <option value="">All Plans</option>
        <option v-for="plan in plans" :key="plan.slug" :value="plan.slug">
          {{ plan.name }}
        </option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="trialing">Trialing</option>
      </select>
      <select v-model="filterWarning" class="filter-select">
        <option value="">All Usage</option>
        <option value="warning">Warnings (>= 80%)</option>
        <option value="critical">Critical (>= 100%)</option>
      </select>
    </div>

    <div class="table-wrapper">
      <table class="usage-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Tables Used</th>
            <th>Tables Limit</th>
            <th>Reservations Used</th>
            <th>Reservations Limit</th>
            <th>Warnings</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredUsage" :key="item.tenantId">
            <td>
              <button @click="viewTenant(item.tenantId)" class="link-btn">
                {{ item.tenantName }}
              </button>
            </td>
            <td>{{ item.plan }}</td>
            <td>
              <span :class="['status-badge', item.status]">
                {{ item.status }}
              </span>
            </td>
            <td>{{ item.tablesUsed || 0 }}</td>
            <td>{{ item.tablesLimit || "—" }}</td>
            <td>
              <span
                :class="{
                  warning:
                    getUsagePercent(item.tablesUsed, item.tablesLimit) >= 80,
                  danger:
                    getUsagePercent(item.tablesUsed, item.tablesLimit) >= 100,
                }"
              >
                {{ item.reservationsUsed || 0 }}
              </span>
            </td>
            <td>{{ item.reservationsLimit || "—" }}</td>
            <td>
              <div class="usage-bars">
                <div class="usage-bar">
                  <div
                    class="usage-bar-fill"
                    :class="
                      getBarClass(
                        getUsagePercent(item.tablesUsed, item.tablesLimit)
                      )
                    "
                    :style="{
                      width:
                        clampPercent(
                          getUsagePercent(item.tablesUsed, item.tablesLimit)
                        ) + '%',
                    }"
                  ></div>
                  <span class="usage-bar-label">{{
                    formatPercent(
                      getUsagePercent(item.tablesUsed, item.tablesLimit)
                    )
                  }}</span>
                </div>
                <div class="usage-bar">
                  <div
                    class="usage-bar-fill"
                    :class="
                      getBarClass(
                        getUsagePercent(
                          item.reservationsUsed,
                          item.reservationsLimit
                        )
                      )
                    "
                    :style="{
                      width:
                        clampPercent(
                          getUsagePercent(
                            item.reservationsUsed,
                            item.reservationsLimit
                          )
                        ) + '%',
                    }"
                  ></div>
                  <span class="usage-bar-label">{{
                    formatPercent(
                      getUsagePercent(
                        item.reservationsUsed,
                        item.reservationsLimit
                      )
                    )
                  }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Loading usage data...</p>
    </div>
    <div v-else-if="!filteredUsage.length" class="empty-state">
      <p>No usage data found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import usageAPI from "@/services/usageAPI";
import planAPI from "@/services/planAPI";

const router = useRouter();
const loading = ref(true);
const usageData = ref([]);
const plans = ref([]);
const searchQuery = ref("");
const filterPlan = ref("");
const filterStatus = ref("");
const filterWarning = ref("");

const summary = computed(() => {
  const data = usageData.value;
  return {
    totalTenants: data.length,
    warningsCount: data.filter((u) => {
      const tablesPct = getUsagePercent(u.tablesUsed, u.tablesLimit);
      const reservationsPct = getUsagePercent(
        u.reservationsUsed,
        u.reservationsLimit
      );
      return tablesPct >= 80 || reservationsPct >= 80;
    }).length,
    avgTablesUsage: data.length
      ? Math.round(
          data.reduce(
            (sum, u) => sum + getUsagePercent(u.tablesUsed, u.tablesLimit),
            0
          ) / data.length
        )
      : 0,
    avgReservationsUsage: data.length
      ? Math.round(
          data.reduce(
            (sum, u) =>
              sum + getUsagePercent(u.reservationsUsed, u.reservationsLimit),
            0
          ) / data.length
        )
      : 0,
  };
});

const filteredUsage = computed(() => {
  return usageData.value.filter((u) => {
    const matchesSearch =
      !searchQuery.value ||
      u.tenantName?.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesPlan = !filterPlan.value || u.plan === filterPlan.value;
    const matchesStatus =
      !filterStatus.value || u.status === filterStatus.value;
    const tablesPct = getUsagePercent(u.tablesUsed, u.tablesLimit);
    const reservationsPct = getUsagePercent(
      u.reservationsUsed,
      u.reservationsLimit
    );
    const isWarning = tablesPct >= 80 || reservationsPct >= 80;
    const isCritical = tablesPct >= 100 || reservationsPct >= 100;
    const matchesWarning =
      !filterWarning.value ||
      (filterWarning.value === "warning" && isWarning) ||
      (filterWarning.value === "critical" && isCritical);
    return matchesSearch && matchesPlan && matchesStatus && matchesWarning;
  });
});

const loadUsage = async () => {
  loading.value = true;
  try {
    const response = await usageAPI.listUsage();
    usageData.value = response.data.collection || response.data || [];
  } catch (err) {
    usageData.value = [];
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

const viewTenant = (id) => {
  router.push(`/admin/tenants/${id}`);
};

const getUsagePercent = (used, limit) => {
  if (!limit || limit <= 0) return 0;
  const u = Number(used) || 0;
  return Math.round((u / limit) * 100);
};

const clampPercent = (val) => {
  return Math.min(100, Math.max(0, val));
};

const formatPercent = (val) => {
  return `${val}%`;
};

const getBarClass = (pct) => {
  if (pct >= 100) return "bar-danger";
  if (pct >= 80) return "bar-warning";
  return "bar-success";
};

onMounted(() => {
  loadUsage();
  loadPlans();
});
</script>

<style scoped>
.usage-view {
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
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-bottom: var(--space-2);
  font-weight: 500;
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.card-value.warning {
  color: var(--accent-600);
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.search-input,
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.search-input {
  flex: 1;
  max-width: 320px;
}
.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.usage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.usage-table th,
.usage-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.usage-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.usage-table tbody tr:hover {
  background: var(--surface-sunken);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.past_due {
  background: var(--accent-100);
  color: var(--accent-600);
}
.status-badge.suspended {
  background: var(--rose-100);
  color: var(--rose-600);
}
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.status-badge.trialing {
  background: var(--sky-100);
  color: var(--sky-600);
}
.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  text-decoration: underline;
  padding: 0;
}
.link-btn:hover {
  color: var(--accent-600);
}
.usage-bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
  min-width: 140px;
}
.usage-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.usage-bar-fill {
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--border-subtle);
  overflow: hidden;
  flex: 1;
  max-width: 100px;
}
.bar-success {
  background: var(--earth-500);
}
.bar-warning {
  background: var(--accent-500);
}
.bar-danger {
  background: var(--rose-500);
}
.usage-bar-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink-muted);
  min-width: 36px;
  text-align: right;
}
.warning {
  color: var(--accent-600);
  font-weight: 600;
}
.danger {
  color: var(--rose-600);
  font-weight: 600;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-muted);
}
</style>

<template>
  <div class="main-wrapper">
    <PageHeader title="No-Show Tracker" subtitle="Track missed reservations" />
    <div class="content-wrapper">
      <div class="filters">
        <div class="form-group">
          <label class="form-label">From</label>
          <input
            type="date"
            class="form-select"
            v-model="fromDate"
            @change="loadNoShows"
          />
        </div>
        <div class="form-group">
          <label class="form-label">To</label>
          <input
            type="date"
            class="form-select"
            v-model="toDate"
            @change="loadNoShows"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Customer</label>
          <input
            type="text"
            class="form-select"
            v-model="customerQuery"
            placeholder="Search name or email..."
            @input="loadNoShows"
          />
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ noShows.length }}</span>
          <span class="stat-label">Total No-Shows</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ uniqueCustomers }}</span>
          <span class="stat-label">Unique Customers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ noShowRate }}%</span>
          <span class="stat-label">No-Show Rate</span>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading no-shows...</p>
      </div>
      <div v-else-if="errorMsg" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ errorMsg }}</p>
      </div>
      <div v-else-if="!noShows.length" class="empty-state">
        <p>No missed reservations found.</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Party</th>
              <th>Table</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in noShows" :key="res.id">
              <td>{{ res.resDate }}</td>
              <td>{{ (res.resTime || "").slice(0, 5) }}</td>
              <td>
                {{ res.customerName || "Guest" }}
                <span v-if="res.customerEmail" class="muted">
                  ({{ res.customerEmail }})
                </span>
              </td>
              <td>{{ res.people }}</td>
              <td>{{ res.tableName || "—" }}</td>
              <td>
                <span class="status-badge missed">No-Show</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import PageHeader from "@/components/PageHeader.vue";
import logger from "@/utils/logger";
import dateNavigator from "@/utils/dateNavigator";

const loading = ref(true);
const errorMsg = ref("");
const noShows = ref([]);
const totalReservations = ref(0);
const fromDate = ref("");
const toDate = ref("");
const customerQuery = ref("");

const uniqueCustomers = computed(() => {
  const seen = new Set();
  noShows.value.forEach((r) => {
    const key = r.customerEmail || r.customerName || r.id;
    seen.add(key);
  });
  return seen.size;
});

const noShowRate = computed(() => {
  if (!totalReservations.value) return 0;
  return Math.round((noShows.value.length / totalReservations.value) * 100);
});

const loadNoShows = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const params = { status: "missed" };
    if (fromDate.value) params.from = fromDate.value;
    if (toDate.value) params.to = toDate.value;
    if (customerQuery.value) params.q = customerQuery.value;

    const [noShowRes, statsRes] = await Promise.all([
      reservationAPI.getReservations(params),
      reservationAPI
        .getReservationStats({
          from: fromDate.value || undefined,
          to: toDate.value || undefined,
        })
        .catch(() => ({ data: {} })),
    ]);

    noShows.value = noShowRes.data.collection || [];
    totalReservations.value = statsRes.data?.total || noShows.value.length || 0;
  } catch (err) {
    errorMsg.value = "Failed to load no-shows";
    logger.error("Failed to load no-shows", { error: err.message });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const now = new Date();
  toDate.value = dateNavigator.asDateString(now);
  const past = new Date(now);
  past.setDate(past.getDate() - 30);
  fromDate.value = dateNavigator.asDateString(past);
  loadNoShows();
});
</script>

<style scoped>
.filters {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.form-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.form-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  min-width: 160px;
}
.stats-row {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.stat-value {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
}
.stat-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  font-weight: 600;
  color: var(--ink-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  background: var(--neutral-50);
}
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.missed {
  background: #fee2e2;
  color: #991b1b;
}
.muted {
  color: var(--ink-muted);
  font-size: var(--text-xs);
}
.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-20) var(--space-5);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
  border-radius: var(--radius-lg);
}
.error-state {
  background: var(--rose-50);
  border: 1px solid var(--rose-200, #fecaca);
  color: var(--rose-600);
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
</style>

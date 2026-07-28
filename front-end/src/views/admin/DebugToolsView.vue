<template>
  <div class="debug-view">
    <div class="page-header">
      <div>
        <h1>Debug Tools</h1>
        <p class="subtitle">Venue and platform diagnostic information</p>
      </div>
    </div>

    <div class="card" style="margin-bottom: var(--space-5)">
      <h3>Platform Summary</h3>
      <div v-if="platformLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="platformData" class="debug-grid">
        <div class="debug-item">
          <span>Tenants</span>
          <b>{{ platformData.counts.tenants }}</b>
        </div>
        <div class="debug-item">
          <span>Users</span>
          <b>{{ platformData.counts.users }}</b>
        </div>
        <div class="debug-item">
          <span>Reservations</span>
          <b>{{ platformData.counts.reservations }}</b>
        </div>
        <div class="debug-item">
          <span>Environment</span>
          <b>{{ platformData.nodeEnv }}</b>
        </div>
        <div class="debug-item">
          <span>Redis</span>
          <b
            :class="
              platformData.redis === 'configured'
                ? 'status-healthy'
                : 'status-failed'
            "
            >{{ platformData.redis }}</b
          >
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Venue Inspection</h3>
      <div class="venue-select">
        <input
          v-model="tenantId"
          type="number"
          class="filter-select"
          placeholder="Enter venue ID"
        />
        <button
          class="btn-primary"
          @click="loadTenant"
          :disabled="tenantLoading || !tenantId"
        >
          Inspect
        </button>
      </div>
      <div v-if="tenantLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="tenantData" class="venue-result">
        <div class="venue-header">
          <div>
            <h4>{{ tenantData.tenant.name }}</h4>
            <p class="text-muted">
              {{ tenantData.tenant.slug }} • {{ tenantData.tenant.status }} •
              {{ tenantData.tenant.businessVertical }}
            </p>
          </div>
        </div>
        <div class="debug-grid">
          <div class="debug-item">
            <span>Users</span>
            <b>{{ tenantData.counts.users }}</b>
          </div>
          <div class="debug-item">
            <span>Customers</span>
            <b>{{ tenantData.counts.customers }}</b>
          </div>
        </div>
        <div v-if="tenantData.recentAppointments?.length" class="debug-section">
          <h5>Recent Appointments</h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Status</th>
                <th>Start</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apt in tenantData.recentAppointments" :key="apt.id">
                <td>{{ apt.id }}</td>
                <td>{{ apt.service?.name || "—" }}</td>
                <td>{{ apt.status }}</td>
                <td>{{ formatDate(apt.start) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="tenantData.recentReservations?.length" class="debug-section">
          <h5>Recent Reservations</h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="res in tenantData.recentReservations" :key="res.id">
                <td>{{ res.id }}</td>
                <td>
                  {{ res.customer?.firstName }} {{ res.customer?.lastName }}
                </td>
                <td>{{ res.status }}</td>
                <td>{{ formatDate(res.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const platformLoading = ref(false);
const platformData = ref(null);
const tenantId = ref("");
const tenantLoading = ref(false);
const tenantData = ref(null);

const loadPlatform = async () => {
  platformLoading.value = true;
  try {
    const res = await adminAPI.getPlatformDebug();
    platformData.value = res.data || null;
  } finally {
    platformLoading.value = false;
  }
};

const loadTenant = async () => {
  if (!tenantId.value) return;
  tenantLoading.value = true;
  try {
    const res = await adminAPI.getTenantDebug(tenantId.value);
    tenantData.value = res.data || null;
  } finally {
    tenantLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

onMounted(() => {
  loadPlatform();
});
</script>

<style scoped>
.debug-view {
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
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}
.debug-item {
  text-align: center;
  padding: var(--space-3);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
}
.debug-item span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  font-weight: 600;
}
.debug-item b {
  display: block;
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  color: var(--ink);
  margin-top: var(--space-1);
}
.status-healthy {
  color: var(--earth-600);
}
.status-failed {
  color: var(--rose-600);
}
.venue-select {
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
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
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
.venue-header {
  margin-bottom: var(--space-3);
}
.venue-header h4 {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.text-muted {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.debug-section {
  margin-top: var(--space-4);
}
.debug-section h5 {
  margin: 0 0 var(--space-2) 0;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--ink-muted);
  text-transform: uppercase;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th,
.data-table td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  text-transform: uppercase;
  font-size: var(--text-xs);
}
</style>

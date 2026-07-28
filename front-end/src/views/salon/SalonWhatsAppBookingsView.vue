<template>
  <div class="whatsapp-bookings-view">
    <div class="page-header">
      <div>
        <h1>{{ t("salon.whatsappBookings") }}</h1>
        <p class="subtitle">{{ t("salon.whatsappBookingsSubtitle") }}</p>
      </div>
      <button class="btn-primary" @click="load" :disabled="loading">
        {{ loading ? t("salon.refreshing") : t("salon.refresh") }}
      </button>
    </div>

    <div class="filters">
      <select v-model="filterStatus" class="filter-select" @change="load">
        <option value="">{{ t("salon.allStatuses") }}</option>
        <option value="pending">{{ t("salon.pending") }}</option>
        <option value="confirmed">{{ t("salon.confirmed") }}</option>
        <option value="in_progress">{{ t("salon.inProgress") }}</option>
        <option value="completed">{{ t("salon.completed") }}</option>
        <option value="cancelled">{{ t("salon.cancelled") }}</option>
        <option value="no_show">{{ t("salon.noShow") }}</option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('salon.searchCustomerOrService')"
        class="filter-select"
        @input="load"
      />
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No WhatsApp bookings found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Stylist</th>
              <th>Station</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in items" :key="apt.id">
              <td>{{ formatDate(apt.start) }}</td>
              <td>{{ formatTime(apt.start) }}</td>
              <td>
                {{ apt.customer?.firstName }} {{ apt.customer?.lastName }}
              </td>
              <td>{{ apt.service?.name }}</td>
              <td>{{ apt.stylist?.name || "—" }}</td>
              <td>{{ apt.station?.name || "—" }}</td>
              <td>
                <span class="badge" :class="'badge-' + apt.status">
                  {{ apt.status }}
                </span>
              </td>
              <td>{{ apt.paymentStatus || "unpaid" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import appointmentAPI from "@/services/appointmentAPI";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const loading = ref(false);
const items = ref([]);
const filterStatus = ref("");
const searchQuery = ref("");

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const load = async () => {
  loading.value = true;
  try {
    const params = {
      source: "whatsapp",
      limit: 100,
    };
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await appointmentAPI.getAppointments(params);
    let data = res.data?.data || [];
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      data = data.filter((apt) => {
        const name = `${apt.customer?.firstName || ""} ${
          apt.customer?.lastName || ""
        }`.toLowerCase();
        const service = (apt.service?.name || "").toLowerCase();
        return name.includes(q) || service.includes(q);
      });
    }
    items.value = data;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.whatsapp-bookings-view {
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
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.badge-pending {
  background: var(--amber-100);
  color: var(--amber-700);
}
.badge-confirmed {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-completed {
  background: var(--brand-100);
  color: var(--brand-700);
}
.badge-cancelled,
.badge-no_show {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
</style>

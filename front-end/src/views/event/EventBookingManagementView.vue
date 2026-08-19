<template>
  <div class="event-booking-management">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">← Back to Events</button>
      <div>
        <h1>Bookings</h1>
        <p v-if="eventName" class="subtitle">{{ eventName }}</p>
      </div>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search bookings..."
        class="search-input"
        @input="debouncedLoad"
      />
      <select v-model="filterStatus" class="filter-select" @change="load">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No bookings found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Tickets</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.customerName || "—" }}</td>
              <td>{{ item.customerEmail || "—" }}</td>
              <td>{{ item.quantity || 1 }}</td>
              <td>{{ formatCurrency(item.totalAmount) }}</td>
              <td>
                <span class="badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="actions-cell">
                <button
                  v-if="item.status === 'pending'"
                  class="btn-sm"
                  @click="updateStatus(item, 'confirmed')"
                >
                  Confirm
                </button>
                <button
                  v-if="
                    item.status !== 'cancelled' && item.status !== 'completed'
                  "
                  class="btn-sm btn-danger"
                  @click="updateStatus(item, 'cancelled')"
                >
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

const loading = ref(true);
const items = ref([]);
const eventName = ref("");
const searchQuery = ref("");
const filterStatus = ref("");

const eventId = route.params.eventId;

let debounceTimer = null;
const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
};

const load = async () => {
  loading.value = true;
  try {
    const params = { eventId };
    if (searchQuery.value) params.search = searchQuery.value;
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await eventPortalAPI.getBookings(params);
    items.value = res.data?.rows || res.data || [];
  } catch (err) {
    toastStore.add("Failed to load bookings", "error");
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(value);
};

const statusClass = (status) => {
  const map = {
    pending: "t-past",
    confirmed: "t-upcoming",
    cancelled: "t-cancelled",
    completed: "t-completed",
  };
  return map[status] || "t-past";
};

const updateStatus = async (item, status) => {
  try {
    if (status === "cancelled") {
      await eventPortalAPI.cancelBooking(item.id);
    } else {
      await eventPortalAPI.updateBooking(item.id, { status });
    }
    toastStore.add(`Booking ${status}`, "success");
    load();
  } catch (err) {
    toastStore.add("Failed to update booking", "error");
  }
};

const goBack = () => {
  router.push("/events/manage");
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.event-booking-management {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
}
.subtitle {
  color: var(--color-text-muted);
  margin: var(--space-1) 0 0;
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input {
  flex: 1;
  max-width: 400px;
}
.filter-select {
  min-width: 160px;
}
.card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}
.spinner-sm {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.data-table th {
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-surface-alt);
  border: var(--border-default);
}
.t-upcoming {
  background: #e6f4ea;
  color: #1e7e34;
  border-color: #e6f4ea;
}
.t-past {
  background: #f1f3f5;
  color: #495057;
  border-color: #f1f3f5;
}
.t-cancelled {
  background: #fce8e8;
  color: #c92a2a;
  border-color: #fce8e8;
}
.t-completed {
  background: #e6f4ea;
  color: #2b8a3e;
  border-color: #e6f4ea;
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-sm:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.btn-danger {
  border-color: #fce8e8;
  color: #c92a2a;
}
.btn-danger:hover {
  background: #fce8e8;
}
</style>

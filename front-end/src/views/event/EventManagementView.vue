<template>
  <div class="event-management">
    <div class="page-header">
      <div>
        <h1>Events</h1>
        <p class="subtitle">Manage your events and ticket sales</p>
      </div>
      <button class="btn-primary" @click="goToCreate">+ New Event</button>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search events..."
        class="search-input"
        @input="debouncedLoad"
      />
      <select v-model="filterStatus" class="filter-select" @change="load">
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        No events found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Status</th>
              <th>Tickets</th>
              <th>Bookings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <div class="cell-primary">{{ item.name }}</div>
                <div class="cell-secondary">
                  {{ item.eventType || "General" }}
                </div>
              </td>
              <td>{{ formatDate(item.eventDate) }}</td>
              <td>
                <span class="badge" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <span v-if="item.isTicketed" class="badge badge-info">
                  Ticketed
                </span>
                <span v-else class="badge">Free</span>
              </td>
              <td>{{ item._bookingCount || 0 }}</td>
              <td class="actions-cell">
                <button class="btn-sm" @click="goToEdit(item.id)">Edit</button>
                <button class="btn-sm" @click="goToBookings(item.id)">
                  Bookings
                </button>
                <button class="btn-sm btn-danger" @click="confirmDelete(item)">
                  Delete
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
import { useRouter } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const toastStore = useToastStore();

const loading = ref(true);
const items = ref([]);
const searchQuery = ref("");
const filterStatus = ref("");

let debounceTimer = null;
const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
};

const load = async () => {
  loading.value = true;
  try {
    const params = {};
    if (searchQuery.value) params.search = searchQuery.value;
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await eventPortalAPI.getEvents(params);
    items.value = res.data?.rows || res.data || [];
  } catch (err) {
    toastStore.add("Failed to load events", "error");
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

const statusClass = (status) => {
  const map = {
    draft: "t-past",
    published: "t-upcoming",
    cancelled: "t-cancelled",
    completed: "t-completed",
  };
  return map[status] || "t-past";
};

const goToCreate = () => {
  router.push("/events/new");
};

const goToEdit = (id) => {
  router.push(`/events/${id}/edit`);
};

const goToBookings = (id) => {
  router.push(`/events/${id}/bookings`);
};

const confirmDelete = async (item) => {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) {
    return;
  }
  try {
    await eventPortalAPI.deleteEvent(item.id);
    toastStore.add("Event deleted", "success");
    load();
  } catch (err) {
    toastStore.add("Failed to delete event", "error");
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.event-management {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1);
}
.subtitle {
  color: var(--color-text-muted);
  margin: 0;
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
.cell-primary {
  font-weight: 600;
}
.cell-secondary {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--color-surface-alt);
  border: var(--border-default);
}
.badge-info {
  background: var(--color-primary-soft, #e6f0ff);
  color: var(--color-primary, #2563eb);
  border-color: var(--color-primary-soft, #e6f0ff);
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
  font-size: var(--text-xs);
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

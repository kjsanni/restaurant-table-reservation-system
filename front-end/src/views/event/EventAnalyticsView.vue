<template>
  <div class="event-analytics">
    <div class="page-header">
      <div>
        <h1>Event Analytics</h1>
        <p class="subtitle">Performance insights and booking trends</p>
      </div>
    </div>

    <div class="filters">
      <select v-model="selectedEventId" class="filter-select" @change="load">
        <option value="">Select event</option>
        <option v-for="event in events" :key="event.id" :value="event.id">
          {{ event.name }}
        </option>
      </select>
      <input v-model="dateFrom" type="date" class="filter-input" @change="load" />
      <span class="filter-separator">to</span>
      <input v-model="dateTo" type="date" class="filter-input" @change="load" />
    </div>

    <div v-if="!selectedEventId" class="empty-state">
      Select an event to view analytics
    </div>
    <div v-else-if="loading" class="loading-state-inline">
      <div class="spinner-sm"></div>
    </div>
    <div v-else-if="summary" class="analytics-grid">
      <div class="card stat-card">
        <div class="stat-label">Total Bookings</div>
        <div class="stat-value">{{ summary.totalBookings }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Confirmed</div>
        <div class="stat-value">{{ summary.totalConfirmed }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value">{{ summary.totalPending }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Revenue</div>
        <div class="stat-value">{{ formatGhs(summary.totalRevenue) }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Tickets Sold</div>
        <div class="stat-value">{{ summary.totalTicketsSold }}</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Cancelled</div>
        <div class="stat-value">{{ summary.totalCancelled }}</div>
      </div>
    </div>

    <div v-if="summary" class="analytics-details">
      <div class="card">
        <h3>By Ticket Type</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket Type</th>
              <th>Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(val, key) in summary.byTicketType" :key="key">
              <td>{{ key }}</td>
              <td>{{ val.count }}</td>
              <td>{{ formatGhs(val.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>By Status</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, status) in summary.byStatus" :key="status">
              <td class="capitalize">{{ status }}</td>
              <td>{{ count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import eventAPI from "@/services/eventPortalAPI";

interface EventOption {
  id: number;
  name: string;
}

interface AnalyticsSummary {
  eventId: number;
  eventName: string;
  totalBookings: number;
  totalConfirmed: number;
  totalPending: number;
  totalCancelled: number;
  totalRevenue: number;
  totalTicketsSold: number;
  byTicketType: Record<string, { count: number; revenue: number }>;
  byStatus: Record<string, number>;
}

const events = ref<EventOption[]>([]);
const selectedEventId = ref<number | "">("");
const dateFrom = ref("");
const dateTo = ref("");
const loading = ref(true);
const summary = ref<AnalyticsSummary | null>(null);

const load = async () => {
  loading.value = true;
  try {
    if (events.value.length === 0) {
      const res = await eventAPI.getEvents({ limit: 100 });
      const rows = (res.data?.rows || res.data || []) as EventOption[];
      events.value = rows;
    }

    if (selectedEventId.value) {
      const params: Record<string, any> = { eventId: selectedEventId.value };
      if (dateFrom.value) params.from = dateFrom.value;
      if (dateTo.value) params.to = dateTo.value;

      const res = await eventAPI.getEventAnalytics(selectedEventId.value as number, params);
      summary.value = res.data?.data || null;
    } else {
      summary.value = null;
    }
  } finally {
    loading.value = false;
  }
};

const formatGhs = (amount: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(amount);
};

onMounted(load);
</script>

<style scoped>
.event-analytics {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
  font-size: 24px;
}
.subtitle {
  margin: var(--space-1) 0 0;
  color: var(--neutral-500);
}
.filters {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  margin-bottom: var(--space-6);
}
.filter-select,
.filter-input {
  padding: 10px 14px;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  font-size: 14px;
}
.filter-separator {
  color: var(--neutral-500);
  font-size: 13px;
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 24px;
  height: 24px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.stat-card {
  padding: var(--space-4);
}
.stat-label {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--neutral-500);
  font-weight: 600;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-top: var(--space-1);
}
.analytics-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}
.card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.card h3 {
  margin: 0 0 var(--space-3);
  font-size: 16px;
  color: var(--neutral-900);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--neutral-100);
  font-size: 14px;
}
.data-table th {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--neutral-500);
  font-weight: 600;
}
.capitalize {
  text-transform: capitalize;
}
</style>

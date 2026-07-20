<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import reservationAPI from "@/services/reservationAPI";
import logger from "@/utils/logger";

interface Reservation {
  id: number;
  resDate: string;
  resTime: string;
  people: number;
  tableName?: string;
  tableId?: number | string;
  resStatus?: string;
  status?: string;
  Customer?: { name?: string; phone?: string };
}

const router = useRouter();
const reservations = ref<Reservation[]>([]);
const loading = ref(true);
const activeFilter = ref<string>("All");

const filters = ["All", "Confirmed", "Pending", "Seated", "Cancelled"];

const filteredReservations = computed(() => {
  if (activeFilter.value === "All") return reservations.value;
  return reservations.value.filter(
    (r) => r.resStatus === activeFilter.value.toLowerCase()
  );
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "—";
  return timeStr.slice(0, 5);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "confirmed",
    pending: "pending",
    seated: "seated",
    cancelled: "cancelled",
    completed: "completed",
    missed: "missed",
  };
  return colors[status] || "secondary";
};

const loadReservations = async () => {
  loading.value = true;
  try {
    const res = await reservationAPI.getReservations({});
    reservations.value = res.data.collection || res.data || [];
  } catch (err) {
    logger.error("Failed to load reservations", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadReservations);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Reservations</h1>
        <p>Manage bookings and walk-ins</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="router.push('/new-reservation')">
          + New Reservation
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="toolbar">
        <button
          v-for="filter in filters"
          :key="filter"
          :class="['chip', { active: activeFilter === filter }]"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reservations...</p>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Date</th>
              <th>Time</th>
              <th>Party</th>
              <th>Table</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="res in filteredReservations" :key="res.id">
              <td>
                <b>{{ res.Customer?.name || "Guest" }}</b>
                <br />
                <span class="guest-phone">{{ res.Customer?.phone || "" }}</span>
              </td>
              <td>{{ formatDate(res.resDate) }}</td>
              <td>{{ formatTime(res.resTime) }}</td>
              <td>{{ res.people }}</td>
              <td>{{ res.tableName || res.tableId || "—" }}</td>
              <td>
                <span
                  :class="[
                    'pill',
                    getStatusColor(res.resStatus || res.status || 'pending'),
                  ]"
                >
                  {{ res.resStatus || res.status }}
                </span>
              </td>
              <td>
                <button
                  class="link"
                  @click="router.push(`/reservations/${res.id}`)"
                >
                  View
                </button>
              </td>
            </tr>
            <tr v-if="!filteredReservations.length">
              <td colspan="7" class="empty-row">No reservations found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.chip {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-800);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: var(--font-sans);
}

.chip:hover,
.chip.active {
  background: var(--brand-100);
  border-color: var(--brand-300);
  color: var(--brand-800);
}

.table-wrap {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead {
  background: var(--neutral-50);
  border-bottom: 1px solid var(--neutral-200);
}

th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans);
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--neutral-100);
  color: var(--neutral-800);
  font-family: var(--font-sans);
}

tr:last-child td {
  border-bottom: none;
}

tr {
  transition: background 0.2s ease;
}

tr:hover td {
  background: rgba(243, 221, 211, 0.35);
}

.pill {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  display: inline-block;
}

.pill.confirmed {
  background: var(--accent-100);
  color: var(--accent-600);
}
.pill.pending {
  background: var(--sky-100);
  color: var(--sky-600);
}
.pill.seated {
  background: var(--earth-100);
  color: var(--earth-600);
}
.pill.cancelled {
  background: var(--rose-100);
  color: var(--rose-600);
}
.pill.completed {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.pill.missed {
  background: var(--rose-100);
  color: var(--rose-600);
}
.pill.secondary {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.guest-phone {
  font-size: 11px;
  color: var(--neutral-600);
}

.link {
  font-size: 12px;
  color: var(--accent-600);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  padding: 0;
  font-family: var(--font-sans);
}

.link:hover {
  text-decoration: underline;
}

.empty-row {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
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

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.btn-primary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}
</style>

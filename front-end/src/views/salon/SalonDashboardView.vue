<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import salonDashboardAPI from "@/services/salonDashboardAPI";
import logger from "@/utils/logger";
import { io, Socket } from "socket.io-client";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(true);
const kpis = ref({
  appointmentsToday: 0,
  revenueToday: 0,
  clientsToday: 0,
  chairUtilization: {
    percent: 0,
    occupied: 0,
    total: 0,
  },
});

const socket = ref<Socket | null>(null);

const quickLinks = [
  {
    path: "/salon/appointments",
    label: "New Appointment",
    icon: "mdi:calendar-plus",
  },
  { path: "/salon/walkins", label: "Walk-ins", icon: "mdi:account-clock" },
  { path: "/salon/clients", label: "Clients", icon: "mdi:account-group" },
  { path: "/salon/reports", label: "Reports", icon: "mdi:chart-bar" },
];

const loadDashboard = async () => {
  loading.value = true;
  try {
    const res = await salonDashboardAPI.getDashboard();
    const data = res.data;
    if (data?.success && data.kpis) {
      kpis.value = data.kpis;
    }
  } catch (err) {
    logger.error("Failed to load salon dashboard", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadDashboard();
  socket.value = io("", { path: "/socket.io" });
  socket.value.on("salon-appointment-created", loadDashboard);
  socket.value.on("salon-appointment-updated", loadDashboard);
  socket.value.on("salon-appointment-deleted", loadDashboard);
});

onUnmounted(() => {
  socket.value?.disconnect();
  socket.value = null;
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Dashboard</h1>
        <p>Today's overview for your salon</p>
      </div>
      <div class="topbar-actions">
        <button class="btn-primary" @click="router.push('/salon/appointments')">
          New Appointment
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading dashboard…</div>

    <template v-else>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Appointments Today</div>
          <div class="kpi-value">{{ kpis.appointmentsToday }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Revenue Today</div>
          <div class="kpi-value">
            GHS {{ kpis.revenueToday.toLocaleString() }}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Clients Today</div>
          <div class="kpi-value">{{ kpis.clientsToday }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Chair Utilization</div>
          <div class="kpi-value">{{ kpis.chairUtilization.percent }}%</div>
          <div class="kpi-delta">
            {{ kpis.chairUtilization.occupied }} of
            {{ kpis.chairUtilization.total }} stations active
          </div>
        </div>
      </div>

      <div class="quick-links">
        <h2>Quick Links</h2>
        <div class="quick-link-grid">
          <button
            v-for="link in quickLinks"
            :key="link.path"
            class="quick-link-card"
            @click="router.push(link.path)"
          >
            <span class="quick-link-icon">{{ link.icon }}</span>
            <span class="quick-link-label">{{ link.label }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #666);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.kpi-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-lg, 14px);
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.kpi-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.5rem;
}
.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #111827);
}
.kpi-delta {
  font-size: 0.85rem;
  color: var(--text-secondary, #4b5563);
  margin-top: 0.25rem;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.topbar-actions {
  display: flex;
  gap: 0.5rem;
}
.btn-primary {
  background: var(--accent-600, #b45309);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 10px);
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary:hover {
  background: var(--accent-700, #92400e);
}
.quick-links h2 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}
.quick-link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}
.quick-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: var(--radius-md, 10px);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.quick-link-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}
.quick-link-icon {
  font-size: 1.5rem;
}
.quick-link-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}
</style>

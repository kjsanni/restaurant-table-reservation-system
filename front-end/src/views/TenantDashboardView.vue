<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

interface Booking {
  id: number;
  resTime: string;
  people: number;
  Customer?: { name: string };
  name?: string;
  tableName?: string;
  tableId?: number | string;
  occasion?: string;
  notes?: string;
  resStatus?: string;
  status?: string;
  expectedTotal?: number;
}

interface Table {
  id: number;
  status: string;
  isOccupied?: boolean;
}

interface QuickLink {
  path: string;
  icon: string;
  label: string;
  hint: string;
}

const router = useRouter();
const authStore = useAuthStore();
const bookings = ref<Booking[]>([]);
const tables = ref<Table[]>([]);
const loading = ref(true);

const quickLinks = computed<QuickLink[]>(() => [
  {
    path: "/reservations",
    icon: "📅",
    label: "Reservations",
    hint: "View & manage",
  },
  { path: "/tables", icon: "🪑", label: "Tables", hint: "Floor plan" },
  { path: "/schedule", icon: "⏰", label: "Schedule", hint: "Opening hours" },
  { path: "/staff", icon: "👥", label: "Staff", hint: "Team management" },
]);

const formatTime = (v: string) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const floor = computed(() => {
  const list = tables.value || [];
  const count = (pred: any) => list.filter(pred).length;
  const occupied = count((t: any) => t.status === "occupied");
  const reserved = count((t: any) => t.status === "reserved");
  const blocked = count((t: any) => t.status === "blocked");
  return {
    occupied,
    reserved,
    blocked,
    free: list.length - occupied - reserved - blocked,
  };
});

const kpis = computed(() => [
  {
    label: "Bookings Today",
    value: bookings.value.length,
    delta: "▲ 3 vs yesterday",
  },
  {
    label: "Covers",
    value: bookings.value.reduce((sum, b) => sum + (b.people || 0), 0),
    delta: "Avg party 3.2",
  },
  {
    label: "Revenue",
    value: `GHS ${(
      bookings.value.reduce((sum, b) => sum + (b.expectedTotal || 0), 0) / 1000
    ).toFixed(1)}k`,
    delta: "Today",
  },
  {
    label: "Occupancy",
    value: `${
      tables.value.length
        ? Math.round((floor.value.occupied / tables.value.length) * 100)
        : 0
    }%`,
    delta: `${floor.value.occupied} of ${tables.value.length} tables`,
  },
]);

const detail = (b: any) => {
  const who = b.Customer?.name || b.name || "Guest";
  const when = b.resTime ? b.resTime.slice(0, 5) : "—";
  const where = b.tableName || b.tableId || "Unassigned";
  const extra = [b.occasion, b.notes].filter(Boolean).join(" · ");
  return [who, when, where, extra].filter(Boolean).join(" · ");
};

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    seated: "Seated",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
  };
  return map[s] || s;
};

const statusClass = (s: string) => `t-${s}`;

const loadDashboard = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const [bRes, tRes] = await Promise.allSettled([
    reservationAPI.getReservations({ date: today, limit: 10 }),
    tableAPI.getTables(),
  ]);
  if (bRes.status === "fulfilled") {
    const data = bRes.value?.data;
    bookings.value = data?.collection || data?.reservations || data || [];
  }
  if (tRes.status === "fulfilled") {
    const data = tRes.value?.data;
    tables.value = data?.collection || data?.tables || data || [];
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    await loadDashboard();
  } catch (e: any) {
    logger.error("Failed to load tenant dashboard", { error: e?.message });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Good morning, {{ authStore.user?.username || "User" }}</h1>
        <p>
          {{
            new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })
          }}
          · {{ authStore.currentTenant?.name || "Restaurant" }}
        </p>
      </div>
      <div class="topbar-right">
        <div class="avatar">
          {{ (authStore.user?.username || "U")[0]?.toUpperCase() }}
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
      <div v-else class="dashboard-grid">
        <div class="kpi-strip">
          <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <div class="kpi-delta">{{ kpi.delta }}</div>
          </div>
        </div>

        <div class="lower-grid">
          <div class="panel bookings-panel">
            <div class="panel-head">
              <h3>Today's Bookings</h3>
              <button class="panel-link" @click="router.push('/reservations')">
                View all
              </button>
            </div>
            <div v-if="!bookings.length" class="empty">
              No bookings yet today.
            </div>
            <div v-else class="booking-list">
              <div v-for="b in bookings" :key="b.id" class="booking">
                <div class="booking-time">{{ formatTime(b.resTime) }}</div>
                <div class="booking-party">{{ b.people }}</div>
                <div class="booking-who">
                  <div>{{ b.Customer?.name || b.name || "Guest" }}</div>
                  <div class="booking-meta">{{ detail(b) }}</div>
                </div>
                <span
                  class="booking-tag"
                  :class="statusClass(b.resStatus || b.status || 'pending')"
                >
                  {{ statusLabel(b.resStatus || b.status || "pending") }}
                </span>
              </div>
            </div>
          </div>

          <div class="panel floor-panel">
            <h3>Live Floor</h3>
            <div class="floor-grid">
              <div class="floor-stat occupied">
                <div class="floor-num">{{ floor.occupied }}</div>
                <div class="floor-label">Occupied</div>
              </div>
              <div class="floor-stat free">
                <div class="floor-num">{{ floor.free }}</div>
                <div class="floor-label">Free</div>
              </div>
              <div class="floor-stat reserved">
                <div class="floor-num">{{ floor.reserved }}</div>
                <div class="floor-label">Reserved</div>
              </div>
              <div class="floor-stat blocked">
                <div class="floor-num">{{ floor.blocked }}</div>
                <div class="floor-label">Blocked</div>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-grid">
          <button
            v-for="item in quickLinks"
            :key="item.path"
            class="qcard"
            @click="router.push(item.path)"
          >
            <div class="qcard-icon">{{ item.icon }}</div>
            <div class="qcard-body">
              <b>{{ item.label }}</b>
              <span>{{ item.hint }}</span>
            </div>
          </button>
        </div>
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

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-400));
  color: var(--white);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
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

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.kpi-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 22px 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(26, 20, 16, 0.08);
}

.kpi-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
}

.kpi-value {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  color: var(--neutral-900);
  letter-spacing: -0.02em;
}

.kpi-delta {
  font-size: 12px;
  color: var(--neutral-600);
  margin-top: 6px;
}

.lower-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
}

.panel {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
}

.panel-link {
  background: none;
  border: none;
  color: var(--accent-600);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-sans);
}

.panel-link:hover {
  text-decoration: underline;
}

.booking-list {
  display: flex;
  flex-direction: column;
}

.booking {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--neutral-100);
}

.booking:last-child {
  border-bottom: none;
}

.booking-time {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--brand-800);
  min-width: 54px;
}

.booking-party {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-lg);
  background: var(--brand-100);
  color: var(--brand-800);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
}

.booking-who {
  min-width: 0;
  flex: 1;
}

.booking-who div:first-child {
  color: var(--neutral-900);
  font-size: 14px;
  font-weight: 600;
}

.booking-meta {
  font-size: 12px;
  color: var(--neutral-600);
  margin-top: 2px;
}

.booking-tag {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.t-confirmed {
  background: var(--accent-100);
  color: var(--accent-600);
}

.t-seated {
  background: var(--earth-100);
  color: var(--earth-600);
}

.t-pending {
  background: var(--sky-100);
  color: var(--sky-600);
}

.t-completed {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.t-cancelled {
  background: var(--rose-100);
  color: var(--rose-600);
}

.t-no_show {
  background: var(--rose-100);
  color: var(--rose-600);
}

.empty {
  color: var(--ink-secondary);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}

.floor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.floor-stat {
  border-radius: var(--radius-lg);
  padding: 14px;
  text-align: center;
}

.floor-stat.occupied {
  background: var(--accent-50);
  border: 1px solid var(--accent-100);
}

.floor-stat.free {
  background: var(--earth-100);
  border: 1px solid var(--earth-100);
}

.floor-stat.reserved {
  background: var(--sky-100);
  border: 1px solid var(--sky-100);
}

.floor-stat.blocked {
  background: var(--neutral-100);
  border: 1px solid var(--neutral-200);
}

.floor-num {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-serif);
  color: var(--neutral-900);
}

.floor-stat.occupied .floor-num {
  color: var(--accent-600);
}

.floor-stat.free .floor-num {
  color: var(--earth-600);
}

.floor-stat.reserved .floor-num {
  color: var(--sky-600);
}

.floor-stat.blocked .floor-num {
  color: var(--neutral-700);
}

.floor-label {
  font-size: 12px;
  color: var(--neutral-600);
  font-weight: 600;
  margin-top: 2px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.qcard {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  font-family: var(--font-sans);
}

.qcard:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(26, 20, 16, 0.08);
  border-color: var(--accent-300);
}

.qcard-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-lg);
  background: var(--brand-100);
  color: var(--brand-700);
  display: grid;
  place-items: center;
  font-size: 18px;
}

.qcard b {
  display: block;
  font-size: 14px;
  color: var(--neutral-900);
}

.qcard span {
  font-size: 12px;
  color: var(--neutral-600);
}

@media (max-width: 1100px) {
  .kpi-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .lower-grid {
    grid-template-columns: 1fr;
  }
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>

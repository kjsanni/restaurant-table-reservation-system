<template>
  <div class="tenant-dashboard-view">
    <PageHeader
      :title="`Good ${greeting}, ${firstName}`"
      :subtitle="subtitle"
    />

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard…</p>
      </div>

      <div v-else class="overview-grid">
        <!-- KPI strip -->
        <section class="kpi-strip">
          <article v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value">{{ kpi.value }}</div>
            <span class="kpi-delta" :class="kpi.tone">
              {{ kpi.delta }}
            </span>
          </article>
        </section>

        <!-- Today's bookings + live floor -->
        <section class="lower-grid">
          <div class="panel">
            <h3>Today's Bookings</h3>
            <p class="panel-sub">Upcoming and seated reservations</p>
            <div v-if="todaysBookings.length === 0" class="empty">
              No bookings yet today.
            </div>
            <div v-for="b in todaysBookings" :key="b.id" class="booking">
              <div class="booking-time">{{ b.time }}</div>
              <div class="booking-party">{{ b.partySize }}</div>
              <div class="booking-who">
                <b>{{ b.name }}</b>
                <p>{{ b.detail }}</p>
              </div>
              <span class="booking-tag" :class="statusClass(b.status)">
                {{ b.statusLabel }}
              </span>
            </div>
            <button class="panel-link" @click="goTo('/reservations')">
              View all reservations →
            </button>
          </div>

          <div class="panel">
            <h3>Live Floor</h3>
            <p class="panel-sub">Real-time table status</p>
            <div class="floor-stat">
              <span class="dot" style="background: var(--accent-500)"></span>
              <div><b>Occupied</b><span>Guests being served</span></div>
              <span class="floor-num">{{ floor.occupied }}</span>
            </div>
            <div class="floor-stat">
              <span class="dot" style="background: var(--sky-500)"></span>
              <div><b>Reserved</b><span>Held for arrivals</span></div>
              <span class="floor-num">{{ floor.reserved }}</span>
            </div>
            <div class="floor-stat">
              <span class="dot" style="background: var(--neutral-300)"></span>
              <div><b>Free</b><span>Ready to seat</span></div>
              <span class="floor-num">{{ floor.free }}</span>
            </div>
            <div class="floor-stat">
              <span class="dot" style="background: var(--neutral-500)"></span>
              <div><b>Blocked</b><span>Cleaning / out of service</span></div>
              <span class="floor-num">{{ floor.blocked }}</span>
            </div>
            <button class="panel-link" @click="goTo('/floor-plan')">
              Open floor plan →
            </button>
          </div>
        </section>

        <!-- Quick actions -->
        <div class="section-head"><h2>Quick Actions</h2></div>
        <section class="quick-grid">
          <button class="qcard" @click="goTo('/new-reservation')">
            <div class="qcard-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <b>New Reservation</b><span>Walk-in or call</span>
          </button>
          <button class="qcard" @click="goTo('/floor-plan')">
            <div class="qcard-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 21V8l9-5 9 5v13" />
              </svg>
            </div>
            <b>Open Floor Plan</b><span>Seat &amp; move guests</span>
          </button>
          <button class="qcard" @click="goTo('/waitlist')">
            <div class="qcard-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <b>Add to Waitlist</b><span>Walk-ins waiting</span>
          </button>
          <button class="qcard" @click="goTo('/reports')">
            <div class="qcard-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 3 3 5-6" />
              </svg>
            </div>
            <b>View Reports</b><span>Covers &amp; trends</span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import { useAuthStore } from "@/stores/auth";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import logger from "@/utils/logger";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const bookings = ref([]);
const tables = ref([]);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
});

const firstName = computed(() => {
  const name = authStore.user?.username || authStore.user?.name || "there";
  return String(name).split(" ")[0];
});

const tenantName = computed(
  () =>
    authStore.currentTenant?.name ||
    authStore.branding?.brandName ||
    "your restaurant"
);

const subtitle = computed(
  () =>
    `${new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    })} · ${tenantName.value}`
);

const todaysBookings = computed(() => {
  return bookings.value.slice(0, 6).map((b) => ({
    id: b.id,
    time: formatTime(b.reservationTime || b.time),
    partySize: b.partySize ?? b.party_size ?? "—",
    name: b.customerName || b.name || "Guest",
    detail:
      [b.area || b.notes || "", b.occasion || ""].filter(Boolean).join(" · ") ||
      "Standard",
    status: b.status || "confirmed",
    statusLabel: labelFor(b.status || "confirmed"),
  }));
});

const floor = computed(() => {
  const list = tables.value || [];
  const count = (pred) => list.filter(pred).length;
  const occupied = count((t) => t.status === "occupied");
  const reserved = count((t) => t.status === "reserved");
  const blocked = count((t) => t.status === "blocked");
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
    delta: "▲ vs avg",
    tone: "up",
  },
  {
    label: "Seated Now",
    value: floor.value.occupied,
    delta: `of ${tables.value.length} tables`,
    tone: "up",
  },
  { label: "Reserved", value: floor.value.reserved, delta: "held", tone: "up" },
  {
    label: "Free",
    value: Math.max(0, floor.value.free),
    delta: "ready",
    tone: "up",
  },
]);

const STATUS_LABELS = {
  confirmed: "Confirmed",
  pending: "Pending",
  seated: "Seated",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};
const labelFor = (s) => STATUS_LABELS[s] || s;
const statusClass = (s) => `t-${s}`;

const formatTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const goTo = (path) => router.push(path);

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
  } catch (e) {
    logger.error("Failed to load tenant dashboard", { error: e?.message });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.content-wrapper {
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
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
.overview-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.kpi-card {
  position: relative;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.kpi-card::after {
  content: "";
  position: absolute;
  right: -30px;
  top: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-soft), transparent 70%);
}
.kpi-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
  font-weight: 600;
}
.kpi-value {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--ink);
  margin: var(--space-2) 0 var(--space-1);
  line-height: 1;
  letter-spacing: var(--tracking-tight);
}
.kpi-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}
.kpi-delta.up {
  background: var(--earth-100);
  color: var(--earth-600);
}
.kpi-delta.down {
  background: var(--rose-100);
  color: var(--rose-600);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-head h2 {
  font-family: var(--font-serif);
  font-size: var(--text-xl);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.lower-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--space-4);
}
.panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.panel h3 {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.panel-sub {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: var(--space-1) 0 var(--space-4);
}
.panel-link {
  margin-top: var(--space-4);
  background: none;
  border: none;
  color: var(--accent-600);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  padding: 0;
  font-family: var(--font-sans);
}
.panel-link:hover {
  text-decoration: underline;
}
.booking {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.booking:last-of-type {
  border-bottom: none;
}
.booking-time {
  font-family: var(--font-serif);
  font-size: var(--text-base);
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
  font-size: var(--text-sm);
}
.booking-who {
  min-width: 0;
}
.booking-who b {
  color: var(--ink);
  font-size: var(--text-sm);
}
.booking-who p {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-top: 2px;
}
.booking-tag {
  margin-left: auto;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
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
  color: var(--ink-muted);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}
.floor-stat {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.floor-stat:last-of-type {
  border-bottom: none;
}
.floor-stat .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.floor-stat b {
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.floor-stat span {
  display: block;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.floor-num {
  margin-left: auto;
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--ink);
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.qcard {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  cursor: pointer;
  text-align: left;
  transition: transform var(--duration-200) var(--ease-out),
    box-shadow var(--duration-200) var(--ease-out),
    border-color var(--duration-200) var(--ease-out);
}
.qcard:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-200);
}
.qcard-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-lg);
  background: var(--brand-100);
  color: var(--brand-700);
  display: grid;
  place-items: center;
}
.qcard b {
  font-size: var(--text-sm);
  color: var(--ink);
}
.qcard span {
  font-size: var(--text-xs);
  color: var(--ink-muted);
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

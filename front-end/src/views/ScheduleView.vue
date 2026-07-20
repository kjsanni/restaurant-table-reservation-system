<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import scheduleAPI from "@/services/scheduleAPI";
import logger from "@/utils/logger";

const router = useRouter();
const schedules = ref([]);
const loading = ref(true);

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const openDays = computed(
  () => schedules.value.filter((s: any) => s.isClosed !== true).length
);

const avgHours = computed(() => {
  const openDaysList = schedules.value.filter((s: any) => !s.isClosed);
  if (!openDaysList.length) return "0h";
  const total = openDaysList.reduce((sum: number, s: any) => {
    const open = parseInt(s.openTime?.split(":")[0] || "0");
    const close = parseInt(s.closeTime?.split(":")[0] || "0");
    return sum + Math.max(0, close - open);
  }, 0);
  return `${Math.round(total / openDaysList.length)}h`;
});

const shiftsCount = computed(() => {
  return schedules.value.reduce(
    (sum: number, s: any) => sum + (s.shifts?.length || 0),
    0
  );
});

const dayLabel = (day: string) => {
  if (!day) return "";
  const found = weekDays.find((d) => d.toLowerCase() === day.toLowerCase());
  return found || day;
};

const dayHours = (schedule: any) => {
  if (schedule.isClosed) return "—";
  return `${schedule.openTime || "00:00"} — ${schedule.closeTime || "00:00"}`;
};

const loadSchedules = async () => {
  loading.value = true;
  try {
    const res = await scheduleAPI.getSchedules();
    schedules.value = res.data.schedules || res.data || [];
  } catch (err) {
    logger.error("Failed to load schedule", { error: err });
  } finally {
    loading.value = false;
  }
};

onMounted(loadSchedules);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Schedule</h1>
        <p>Operating hours and weekly plan</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="router.push('/schedule/holidays')">
          + Add Holiday
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>

      <div v-else>
        <div class="kpi-strip">
          <div class="kpi-tile">
            <div class="kpi-label">Open Days</div>
            <div class="kpi-value">{{ openDays }}</div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Avg Hours</div>
            <div class="kpi-value">{{ avgHours }}</div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Shifts</div>
            <div class="kpi-value">{{ shiftsCount }}</div>
          </div>
        </div>

        <div class="schedule-card">
          <h3>Weekly Hours</h3>
          <div
            v-for="schedule in schedules"
            :key="schedule.day"
            class="day-row"
          >
            <div class="day-name">{{ dayLabel(schedule.day) }}</div>
            <div class="day-hours">{{ dayHours(schedule) }}</div>
            <span
              :class="['day-status', schedule.isClosed ? 'closed' : 'open']"
            >
              {{ schedule.isClosed ? "Closed" : "Open" }}
            </span>
          </div>
          <div v-if="!schedules.length" class="empty-state">
            No schedule configured.
          </div>
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

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

.kpi-tile {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px 20px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
}

.kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
  font-family: var(--font-sans);
}

.kpi-value {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--neutral-900);
  letter-spacing: -0.02em;
}

.schedule-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.schedule-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}

.day-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--neutral-100);
}

.day-row:last-child {
  border-bottom: none;
}

.day-name {
  width: 90px;
  font-weight: 700;
  font-size: 13px;
  color: var(--neutral-800);
  font-family: var(--font-sans);
}

.day-hours {
  flex: 1;
  font-size: 13px;
  color: var(--neutral-700);
  font-family: var(--font-sans);
}

.day-status {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--font-sans);
}

.day-status.open {
  background: var(--earth-100);
  color: var(--earth-600);
}

.day-status.closed {
  background: var(--rose-100);
  color: var(--rose-600);
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

.empty-state {
  text-align: center;
  padding: var(--space-10);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
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

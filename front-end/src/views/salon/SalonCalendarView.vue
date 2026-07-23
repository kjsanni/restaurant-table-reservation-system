<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import appointmentAPI from "@/services/appointmentAPI";
import logger from "@/utils/logger";

interface Appointment {
  id: number;
  start: string;
  durationMinutes: number;
  status: string;
  customer?: { firstName?: string; lastName?: string };
  service?: { name?: string };
  station?: { name?: string };
  stylist?: { name?: string };
}

const router = useRouter();
const loading = ref(true);
const appointments = ref<Appointment[]>([]);
const currentDate = ref(new Date());

const startOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const weekStart = computed(() => startOfWeek(currentDate.value));
const weekEnd = computed(() => {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
});

const dayKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const weekDays = computed(() => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
});

const timeSlots = computed(() => {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
});

const grouped = computed<Record<string, Appointment[]>>(() => {
  const map: Record<string, Appointment[]> = {};

  appointments.value.forEach((apt) => {
    const start = new Date(apt.start);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    if (!map[key]) map[key] = [];
    map[key].push(apt);
  });

  return map;
});

const formatHour = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    const res = await appointmentAPI.getAppointments({
      from: weekStart.value.toISOString(),
      to: weekEnd.value.toISOString(),
      limit: 200,
    });
    appointments.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load calendar appointments", { error: err });
  } finally {
    loading.value = false;
  }
};

const prevWeek = () => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() - 7);
  currentDate.value = d;
  loadAppointments();
};

const nextWeek = () => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + 7);
  currentDate.value = d;
  loadAppointments();
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "cal-pending",
    confirmed: "cal-confirmed",
    in_progress: "cal-in-progress",
    completed: "cal-completed",
    cancelled: "cal-cancelled",
    no_show: "cal-no-show",
  };
  return map[status] || "cal-pending";
};

const appointmentStyle = (apt: Appointment) => {
  const start = new Date(apt.start);
  const top = (start.getHours() - 8) * 60 + start.getMinutes();
  const height = Math.max(20, apt.durationMinutes);
  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

onMounted(loadAppointments);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Calendar</h1>
        <p>Weekly appointment overview</p>
      </div>
      <div class="topbar-right">
        <button class="btn-secondary" @click="prevWeek">Previous</button>
        <button class="btn-secondary" @click="nextWeek">Next</button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading calendar...</p>
      </div>

      <div v-else class="calendar">
        <div class="calendar-header">
          <div class="time-gutter"></div>
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            :class="['calendar-day-header', isToday(day) && 'today']"
          >
            <div class="day-name">{{ day.toLocaleDateString([], { weekday: "short" }) }}</div>
            <div class="day-date">{{ day.getDate() }}</div>
          </div>
        </div>

        <div class="calendar-body">
          <div class="time-gutter">
            <div v-for="slot in timeSlots" :key="slot" class="time-label">
              {{ slot }}
            </div>
          </div>

          <div v-for="day in weekDays" :key="day.toISOString()" class="calendar-column">
            <div
              v-for="slot in timeSlots"
              :key="slot + day.toISOString()"
              class="calendar-cell"
            ></div>

            <template v-for="apt in grouped[dayKey(day)]" :key="apt.id">
              <div
                v-if="new Date(apt.start).toDateString() === day.toDateString()"
                :class="['appointment-block', statusClass(apt.status)]"
                :style="appointmentStyle(apt)"
                @click="router.push(`/appointments`)"
              >
                <div class="block-title">{{ apt.service?.name || 'Service' }}</div>
                <div class="block-time">{{ formatHour(apt.start) }}</div>
                <div class="block-client">{{ apt.customer?.firstName }} {{ apt.customer?.lastName }}</div>
                <div class="block-meta">{{ apt.stylist?.name || '' }} {{ apt.station?.name ? '· ' + apt.station.name : '' }}</div>
              </div>
            </template>
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
  gap: 10px;
}
.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
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
  to { transform: rotate(360deg); }
}
.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.calendar {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  overflow: hidden;
}
.calendar-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 1px solid var(--neutral-200);
}
.calendar-day-header {
  padding: 14px 8px;
  text-align: center;
  border-left: 1px solid var(--neutral-100);
}
.calendar-day-header.today {
  background: var(--brand-50);
}
.day-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.day-date {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-top: 4px;
}
.calendar-day-header.today .day-date {
  color: var(--brand-700);
}
.calendar-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}
.time-gutter {
  border-right: 1px solid var(--neutral-200);
}
.time-label {
  height: 60px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--neutral-500);
  text-align: right;
  border-bottom: 1px solid var(--neutral-100);
}
.calendar-column {
  position: relative;
  border-left: 1px solid var(--neutral-100);
}
.calendar-cell {
  height: 60px;
  border-bottom: 1px solid var(--neutral-100);
}
.appointment-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: var(--radius-md);
  padding: 6px 8px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid transparent;
  z-index: 1;
}
.block-title {
  font-weight: 700;
  margin-bottom: 2px;
}
.block-time {
  opacity: 0.85;
}
.block-client {
  font-weight: 600;
  margin-top: 2px;
}
.block-meta {
  opacity: 0.8;
  margin-top: 1px;
}
.cal-pending {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}
.cal-confirmed {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}
.cal-in-progress {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #a5b4fc;
}
.cal-completed {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}
.cal-cancelled {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
.cal-no-show {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5dc;
}
</style>

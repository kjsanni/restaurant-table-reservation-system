<template>
  <div class="unified-schedule-view">
    <div class="page-header">
      <div>
        <h1>Unified Schedule</h1>
        <p class="subtitle">
          Staff shifts, holidays, and appointments in one place
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="goBack" :disabled="loading">
          ← Back
        </button>
      </div>
    </div>

    <div class="controls">
      <button class="btn-ghost" @click="prevWeek">← Prev</button>
      <span class="week-label">{{ weekLabel }}</span>
      <button class="btn-ghost" @click="nextWeek">Next →</button>
      <button class="btn-primary" @click="refresh" :disabled="loading">
        {{ loading ? "Loading..." : "Refresh" }}
      </button>
    </div>

    <div class="schedule-grid">
      <div v-for="day in weekDays" :key="day.key" class="day-column">
        <div class="day-header">
          <div class="day-name">{{ day.name }}</div>
          <div class="day-date">{{ day.date }}</div>
        </div>

        <div class="day-content">
          <div
            v-for="shift in getShiftsForDay(day.key)"
            :key="shift.id"
            class="schedule-item shift-item"
          >
            <div class="item-title">
              Shift: {{ shift.userName || `User #${shift.userId}` }}
            </div>
            <div class="item-meta">{{ shift.dayOfWeek }}</div>
          </div>

          <div
            v-for="holiday in getHolidaysForDay(day.key)"
            :key="holiday.id"
            class="schedule-item holiday-item"
          >
            <div class="item-title">Holiday: {{ holiday.name }}</div>
            <div class="item-meta">{{ holiday.date }}</div>
          </div>

          <div
            v-for="apt in getAppointmentsForDay(day.key)"
            :key="apt.id"
            class="schedule-item appointment-item"
            :class="apt.status"
          >
            <div class="item-title">
              {{ apt.startTime }} — {{ apt.service?.name || "Appointment" }}
            </div>
            <div class="item-meta">
              {{ apt.customer?.firstName }} {{ apt.customer?.lastName }}
              <span class="badge" :class="'badge-' + apt.status">
                {{ apt.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import shiftAPI from "@/services/shiftAPI";
import scheduleAPI from "@/services/scheduleAPI";
import appointmentAPI from "@/services/appointmentAPI";

const router = useRouter();
const loading = ref(false);
const shifts = ref([]);
const holidays = ref([]);
const appointments = ref([]);
const currentDate = ref(new Date());

const weekStart = computed(() => {
  const d = new Date(currentDate.value);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
});

const weekEnd = computed(() => {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
});

const weekLabel = computed(() => {
  const opts = { month: "short", day: "numeric" };
  return `${weekStart.value.toLocaleDateString(
    opts
  )} — ${weekEnd.value.toLocaleDateString(opts)}`;
});

const weekDays = computed(() => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      key,
      name: d.toLocaleDateString(undefined, { weekday: "short" }),
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  }
  return days;
});

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

const getShiftsForDay = (key) => {
  return shifts.value.filter((s) => s.dayOfWeek === key);
};

const getHolidaysForDay = (key) => {
  return holidays.value.filter((h) => h.date === key);
};

const getAppointmentsForDay = (key) => {
  return appointments.value
    .filter((apt) => {
      const start = new Date(apt.start);
      return dayKey(start) === key;
    })
    .map((apt) => {
      const start = new Date(apt.start);
      return {
        ...apt,
        startTime: start.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });
};

const prevWeek = () => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() - 7);
  currentDate.value = d;
  refresh();
};

const nextWeek = () => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + 7);
  currentDate.value = d;
  refresh();
};

const goBack = () => {
  router.back();
};

const refresh = async () => {
  loading.value = true;
  try {
    const [shiftRes, holidayRes, aptRes] = await Promise.all([
      shiftAPI.getShifts(),
      scheduleAPI.getHolidays(),
      appointmentAPI.getAppointments({
        from: weekStart.value.toISOString(),
        to: weekEnd.value.toISOString(),
        limit: 200,
      }),
    ]);
    shifts.value = shiftRes.data?.data || [];
    holidays.value = holidayRes.data || [];
    appointments.value = aptRes.data?.data || [];
  } catch (e) {
    console.error("Failed to load unified schedule", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refresh();
});
</script>

<style scoped>
.unified-schedule-view {
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
.header-actions {
  display: flex;
  gap: var(--space-3);
}
.controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.week-label {
  font-weight: 600;
  color: var(--ink);
}
.btn-ghost {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
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
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-3);
}
.day-column {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  min-height: 400px;
}
.day-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}
.day-name {
  font-weight: 700;
  color: var(--ink);
  font-size: var(--text-sm);
}
.day-date {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.day-content {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.schedule-item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
}
.item-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink);
}
.item-meta {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin-top: var(--space-0-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.shift-item {
  border-left: 3px solid var(--brand-500);
}
.holiday-item {
  border-left: 3px solid var(--accent-500);
}
.appointment-item {
  border-left: 3px solid var(--earth-500);
}
.appointment-item.pending {
  border-left-color: var(--amber-500);
}
.appointment-item.confirmed {
  border-left-color: var(--earth-500);
}
.appointment-item.completed {
  border-left-color: var(--brand-500);
}
.appointment-item.cancelled {
  border-left-color: var(--neutral-400);
}
.appointment-item.no_show {
  border-left-color: var(--rose-500);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-1);
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
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: var(--text-sm);
}
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

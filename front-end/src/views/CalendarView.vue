<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const reservations = ref([]);
const currentDate = ref(new Date());

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ day: null, hasBooking: false, isToday: false });
  }
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    const hasBooking = reservations.value.some(
      (r: any) => r.resDate === dateStr
    );
    const isToday = isCurrentMonth && today.getDate() === d;
    days.push({ day: d, hasBooking, isToday, dateStr });
  }
  return days;
});

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

const loadReservations = async () => {
  loading.value = true;
  try {
    const res = await reservationAPI.getReservations({});
    reservations.value = res.data.collection || [];
  } catch (err) {
    logger.error("Failed to load calendar", { error: err });
  } finally {
    loading.value = false;
  }
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

onMounted(loadReservations);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Calendar</h1>
        <p>Visual overview of bookings and availability</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading calendar...</p>
      </div>

      <div v-else class="calendar">
        <div class="calendar-header">
          <h3>{{ monthLabel }}</h3>
          <div class="calendar-nav">
            <button class="btn-secondary" @click="prevMonth">&larr;</button>
            <button class="btn-secondary" @click="nextMonth">&rarr;</button>
          </div>
        </div>

        <div class="calendar-grid">
          <div v-for="day in weekDays" :key="day" class="cal-head">
            {{ day }}
          </div>

          <div
            v-for="(cell, idx) in calendarDays"
            :key="idx"
            :class="['cal-cell', { empty: !cell.day, today: cell.isToday }]"
          >
            <span v-if="cell.day">{{ cell.day }}</span>
            <span v-if="cell.hasBooking" class="cal-dot"></span>
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

.calendar {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.calendar-header h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.calendar-nav {
  display: flex;
  gap: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.cal-head {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 0;
  font-family: var(--font-sans);
}

.cal-cell {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-100);
  padding: 8px;
  font-size: 12px;
  color: var(--neutral-800);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: var(--font-sans);
}

.cal-cell:hover {
  border-color: var(--accent-300);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.08);
}

.cal-cell.empty {
  background: transparent;
  border-color: transparent;
}

.cal-cell.today {
  background: var(--accent-50);
  border-color: var(--accent-300);
}

.cal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-500);
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

.btn-secondary {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-800);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-secondary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 640px) {
  .calendar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>

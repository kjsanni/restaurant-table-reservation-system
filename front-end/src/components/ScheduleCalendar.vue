<script setup lang="ts">
import { computed } from "vue";
import { VaButton, VaChip, VaCard, VaCardContent } from "vuestic-ui";

export interface ScheduleDay {
  dayOfWeek: string;
  label: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  slotDuration: number;
}

interface Props {
  days: ScheduleDay[];
  modelValue?: ScheduleDay;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue", "toggle", "edit"]);

const selectedDay = computed({
  get: () => props.modelValue,
  set: (val: ScheduleDay | undefined) => {
    if (val) emit("update:modelValue", val);
  },
});

const onToggle = (day: ScheduleDay) => {
  emit("toggle", day);
};

const onEdit = (day: ScheduleDay) => {
  selectedDay.value = day;
  emit("edit", day);
};

const formatTime = (time: string) => {
  if (!time) return "--:--";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${suffix}`;
};
</script>

<template>
  <VaCard>
    <VaCardContent>
      <div class="schedule-grid">
        <div
          v-for="day in days"
          :key="day.dayOfWeek"
          class="schedule-day"
          :class="{
            'schedule-day--closed': day.isClosed,
            'schedule-day--selected': selectedDay?.dayOfWeek === day.dayOfWeek,
          }"
          @click="onEdit(day)"
        >
          <div class="day-header">
            <span class="day-label">{{ day.label }}</span>
            <VaChip
              :color="day.isClosed ? 'secondary' : 'success'"
              size="small"
            >
              {{ day.isClosed ? "Closed" : "Open" }}
            </VaChip>
          </div>
          <div class="day-time">
            <span v-if="!day.isClosed" class="time-range">
              {{ formatTime(day.openTime) }} – {{ formatTime(day.closeTime) }}
            </span>
            <span v-else class="time-range-closed">All day</span>
          </div>
          <div class="day-actions">
            <VaButton
              :preset="day.isClosed ? 'primary' : 'secondary'"
              size="small"
              @click.stop="onToggle(day)"
            >
              {{ day.isClosed ? "Open" : "Close" }}
            </VaButton>
          </div>
        </div>
      </div>
    </VaCardContent>
  </VaCard>
</template>

<style scoped>
.schedule-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .schedule-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .schedule-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}

.schedule-day {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--neutral-50);
  cursor: pointer;
  transition: all 0.15s ease;
}

.schedule-day:hover {
  border-color: var(--sky-500);
  background: var(--sky-50);
}

.schedule-day--selected {
  border-color: var(--sky-500);
  background: var(--sky-50);
  box-shadow: 0 0 0 2px var(--sky-100);
}

.schedule-day--closed {
  background: var(--rose-50);
  border-color: var(--rose-200);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.day-label {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--ink);
}

.day-time {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--ink-muted);
}

.time-range {
  font-family: "Inter-Medium";
  color: var(--sky-600);
}

.time-range-closed {
  color: var(--rose-500);
}

.day-actions {
  margin-top: 4px;
}
</style>

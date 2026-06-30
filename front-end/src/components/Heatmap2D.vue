<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { VaModal } from "vuestic-ui";
import reservationAPI from "@/services/reservationAPI";

const props = defineProps({
  mode: {
    type: String,
    default: "date-hour",
    validator: (v) => ["date-hour", "calendar"].includes(v),
  },
  from: String,
  to: String,
});

const emit = defineEmits(["update:mode", "update:from", "update:to"]);

const loading = ref(true);
const data = ref(null);
const errorMsg = ref("");

const internalMode = ref(props.mode);
const internalFrom = ref(props.from || getDefaultFrom());
const internalTo = ref(props.to || getDefaultTo());

function getDefaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo() {
  return new Date().toISOString().split("T")[0];
}

const maxCount = computed(() => {
  if (!data.value) return 1;
  if (props.mode === "date-hour") {
    const flat = data.value.matrix.flat();
    return flat.length ? Math.max(...flat) : 1;
  }
  const counts = data.value.days.map((d) => d.count);
  return counts.length ? Math.max(...counts) : 1;
});

const legendGradientStyle = computed(() => {
  return {
    background:
      "linear-gradient(to right, #f9fafb, #dbeafe, #93c5fd, #3b82f6, #1d4ed8)",
  };
});

const calendarLegendGradientStyle = computed(() => {
  return {
    background:
      "linear-gradient(to right, #f9fafb, #d1fae5, #34d399, #059669, #047857)",
  };
});

const drillDownMax = computed(() => {
  if (!drillDownHours.value.length) return 1;
  return Math.max(...drillDownHours.value.map((h) => h.count), 1);
});

const cellColor = (count) => {
  if (count === 0) return "#f9fafb";
  const ratio = count / maxCount.value;
  if (ratio < 0.25) return "#dbeafe";
  if (ratio < 0.5) return "#93c5fd";
  if (ratio < 0.75) return "#3b82f6";
  return "#1d4ed8";
};

const calendarCellColor = (count) => {
  if (count === 0) return "#f9fafb";
  const ratio = count / maxCount.value;
  if (ratio < 0.25) return "#d1fae5";
  if (ratio < 0.5) return "#34d399";
  if (ratio < 0.75) return "#059669";
  return "#047857";
};

let debounceTimer = null;
const loadData = async () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    loading.value = true;
    errorMsg.value = "";
    try {
      const res = await reservationAPI.getHeatmapV2({
        from: internalFrom.value,
        to: internalTo.value,
        mode: props.mode,
      });
      data.value = res.data;
    } catch (err) {
      errorMsg.value = "Failed to load heatmap data.";
      data.value = null;
    } finally {
      loading.value = false;
    }
  }, 300);
};

watch(
  () => [props.mode, props.from, props.to],
  () => {
    if (props.mode) internalMode.value = props.mode;
    if (props.from) internalFrom.value = props.from;
    if (props.to) internalTo.value = props.to;
    loadData();
  }
);

onMounted(loadData);

const setMode = (m) => {
  emit("update:mode", m);
};

const setFrom = (v) => emit("update:from", v);
const setTo = (v) => emit("update:to", v);

const selectedDay = ref(null);
const drillDownOpen = ref(false);
const drillDownLoading = ref(false);
const drillDownHours = ref([]);

const openDrillDown = async (day) => {
  if (props.mode !== "calendar") return;
  selectedDay.value = day;
  drillDownOpen.value = true;
  drillDownLoading.value = true;
  drillDownHours.value = [];
  try {
    const res = await reservationAPI.getHeatmapV2({
      from: day.date,
      to: day.date,
      mode: "date-hour",
    });
    const hours = new Set();
    (res.data.hours || []).forEach((h) => hours.add(h));

    const breakdown = [];
    hours.forEach((hour) => {
      const dateIdx = res.data.dates.indexOf(day.date);
      const hIdx = res.data.hours.indexOf(hour);
      const count =
        dateIdx >= 0 && hIdx >= 0 ? res.data.matrix[dateIdx]?.[hIdx] || 0 : 0;
      breakdown.push({ hour, count });
    });
    breakdown.sort((a, b) => a.hour.localeCompare(b.hour));
    drillDownHours.value = breakdown;
  } catch {
    drillDownHours.value = [];
  } finally {
    drillDownLoading.value = false;
  }
};

const closeDrillDown = () => {
  drillDownOpen.value = false;
  selectedDay.value = null;
  drillDownHours.value = [];
};
</script>

<template>
  <div class="heatmap2d">
    <div class="controls">
      <div class="mode-toggle">
        <button
          :class="['mode-btn', { active: props.mode === 'date-hour' }]"
          @click="setMode('date-hour')"
        >
          Date × Hour
        </button>
        <button
          :class="['mode-btn', { active: props.mode === 'calendar' }]"
          @click="setMode('calendar')"
        >
          Calendar
        </button>
      </div>

      <div class="date-range">
        <input
          type="date"
          :value="internalFrom"
          @input="setFrom($event.target.value)"
          class="date-input"
        />
        <span class="range-arrow">→</span>
        <input
          type="date"
          :value="internalTo"
          @input="setTo($event.target.value)"
          class="date-input"
        />
      </div>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="loading" key="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading heatmap...</p>
      </div>

      <div v-else-if="errorMsg" key="error" class="error-state">
        <svg
          class="state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ errorMsg }}</p>
        <button class="retry-btn" @click="loadData">Retry</button>
      </div>

      <div v-else-if="!data" key="empty" class="empty-state">
        <svg
          class="state-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
        <p>No data for selected range.</p>
      </div>

      <div v-else key="content">
        <div class="legend">
          <span class="legend-label">Less</span>
          <div class="legend-gradient-bar">
            <div
              class="legend-gradient-fill"
              :style="legendGradientStyle"
            ></div>
            <div class="legend-ticks">
              <span>0</span>
              <span>{{ Math.ceil(maxCount * 0.25) }}</span>
              <span>{{ Math.ceil(maxCount * 0.5) }}</span>
              <span>{{ Math.ceil(maxCount * 0.75) }}</span>
              <span>{{ maxCount }}</span>
            </div>
          </div>
          <span class="legend-label">More</span>
        </div>

        <template v-if="props.mode === 'date-hour'">
          <div class="heatmap-card">
            <div class="matrix-scroll">
              <div
                class="matrix-grid"
                :style="{
                  gridTemplateColumns: `120px repeat(${data.hours.length}, 1fr)`,
                }"
              >
                <div class="corner-cell"></div>
                <div v-for="hour in data.hours" :key="hour" class="hour-header">
                  {{ hour }}
                </div>

                <template v-for="(date, dIdx) in data.dates" :key="date">
                  <div class="date-label">{{ date }}</div>
                  <div
                    v-for="(hour, hIdx) in data.hours"
                    :key="hour"
                    class="matrix-cell"
                    :style="{
                      backgroundColor: cellColor(data.matrix[dIdx][hIdx]),
                      color:
                        data.matrix[dIdx][hIdx] > 0
                          ? 'var(--primary-black)'
                          : 'transparent',
                    }"
                    :title="`${date} ${hour}: ${data.matrix[dIdx][hIdx]} reservations`"
                  >
                    <span v-if="data.matrix[dIdx][hIdx] > 0" class="cell-count">
                      {{ data.matrix[dIdx][hIdx] }}
                    </span>
                  </div>
                </template>
              </div>
            </div>

            <div class="totals-row">
              <div class="totals-label">Day Total</div>
              <div
                v-for="(total, i) in data.totalsPerDay"
                :key="i"
                class="total-cell"
              >
                {{ total }}
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="props.mode === 'calendar'">
          <div class="legend-calendar">
            <span class="legend-label">Less</span>
            <div class="legend-gradient-bar calendar-legend">
              <div
                class="legend-gradient-fill"
                :style="calendarLegendGradientStyle"
              ></div>
              <div class="legend-ticks">
                <span>0</span>
                <span>{{ Math.ceil(maxCount * 0.25) }}</span>
                <span>{{ Math.ceil(maxCount * 0.5) }}</span>
                <span>{{ Math.ceil(maxCount * 0.75) }}</span>
                <span>{{ maxCount }}</span>
              </div>
            </div>
            <span class="legend-label">More</span>
          </div>

          <div class="calendar-grid">
            <div
              v-for="day in data.days"
              :key="day.date"
              class="calendar-day"
              :style="{ backgroundColor: calendarCellColor(day.count) }"
              @click="openDrillDown(day)"
            >
              <div class="day-date">
                {{
                  new Date(day.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })
                }}
              </div>
              <div class="day-count">{{ day.count }}</div>
              <div v-if="day.peakHour" class="day-peak">
                Peak: {{ day.peakHour }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>

    <va-modal v-model="drillDownOpen" title="Daily Breakdown" size="medium">
      <template #content>
        <div class="drill-down">
          <p v-if="selectedDay" class="drill-date">
            {{ selectedDay.date }} — Total: {{ selectedDay.count }} reservations
          </p>
          <div v-if="drillDownLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading breakdown...</p>
          </div>
          <div v-else-if="!drillDownHours.length" class="empty-state">
            <p>No hourly data available.</p>
          </div>
          <div v-else class="hour-bars">
            <div
              v-for="item in drillDownHours"
              :key="item.hour"
              class="hour-row"
            >
              <span class="hour-label">{{ item.hour }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: drillDownMax
                      ? `${(item.count / drillDownMax) * 100}%`
                      : '0%',
                    backgroundColor: item.count > 0 ? '#3b82f6' : '#e5e7eb',
                  }"
                />
              </div>
              <span class="bar-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </template>
    </va-modal>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.heatmap2d {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 8px 16px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  background: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn:hover {
  background: #f3f4f6;
}

.mode-btn.active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 8px 10px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--primary-black);
}

.range-arrow {
  color: var(--secondary-gray);
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: var(--secondary-gray);
}

.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  gap: 8px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  background: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.retry-btn:hover {
  background: #f3f4f6;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.legend-label {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.legend-gradient-bar {
  position: relative;
  width: 200px;
  height: 22px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.legend-gradient-fill {
  width: 100%;
  height: 100%;
  border-radius: 6px;
}

.legend-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 4px;
}

.legend-ticks span {
  font-family: "Inter-Bold";
  font-size: 10px;
  color: var(--primary-black);
}

.legend-calendar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.heatmap-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.matrix-scroll {
  overflow-x: auto;
  border-radius: var(--card-radius);
}

.matrix-grid {
  display: grid;
  gap: 4px;
  min-width: 640px;
}

.corner-cell {
  background: #fafafa;
  border-radius: 8px;
}

.hour-header {
  background: #fafafa;
  text-align: center;
  padding: 10px 4px;
  font-family: "Inter-Bold";
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--secondary-gray);
  border-radius: 8px;
}

.date-label {
  background: #fafafa;
  text-align: right;
  padding: 10px;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--secondary-gray);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.matrix-cell {
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  user-select: none;
}

.matrix-cell:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-blue);
  z-index: 2;
}

.cell-count {
  font-family: "Inter-Bold";
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-black);
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.4);
}

.totals-row {
  display: contents;
}

.total-cell {
  background: #f3f4f6;
  text-align: center;
  padding: 8px;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--primary-black);
  border-radius: 6px;
}

.totals-label {
  background: #f3f4f6;
  text-align: right;
  padding: 8px 10px;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.calendar-day {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: 16px 12px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 100px;
}

.calendar-day:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.day-date {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
}

.day-count {
  font-family: "Inter-Bold";
  font-size: 24px;
  color: var(--primary-black);
}

.day-peak {
  font-family: "Inter-Light";
  font-size: 11px;
  color: var(--secondary-gray);
}

.drill-down {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drill-date {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
  margin: 0;
}

.hour-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hour-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hour-label {
  width: 50px;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--secondary-gray);
  text-align: right;
}

.bar-track {
  flex: 1;
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-count {
  width: 30px;
  text-align: right;
  font-family: "Inter-Bold";
  font-size: 12px;
  color: var(--primary-black);
}

@media screen and (max-width: 1024px) {
  .matrix-scroll {
    border-radius: var(--card-radius);
  }

  .calendar-grid {
    gap: 8px;
  }
}

@media screen and (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .mode-toggle {
    justify-content: center;
  }

  .date-range {
    justify-content: center;
  }

  .calendar-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .matrix-grid {
    min-width: 480px;
  }

  .legend-gradient-bar {
    width: 160px;
  }

  .day-count {
    font-size: 20px;
  }

  .calendar-day {
    padding: 12px 8px;
  }
}

@media screen and (max-width: 480px) {
  .calendar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .date-input {
    font-size: 12px;
    padding: 6px 8px;
  }

  .mode-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>

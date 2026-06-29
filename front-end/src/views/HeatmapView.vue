<script setup>
import { ref, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";

const heatmapData = ref([]);
const loading = ref(true);
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 14 }, (_, i) => `${(i + 11) % 24}:00`);

const hoveredCell = ref(null);

onMounted(async () => {
  await loadHeatmapData();
});

const loadHeatmapData = async () => {
  loading.value = true;
  try {
    const res = await reservationAPI.getReservationsHeatmap();
    heatmapData.value = Array.isArray(res.data?.heatmap) ? res.data.heatmap : [];
  } catch (err) {
    logger.error("Failed to load heatmap", { error: err.message });
    heatmapData.value = [];
  } finally {
    loading.value = false;
  }
};

const getCellCount = (hour, day) => {
  const data = Array.isArray(heatmapData.value) ? heatmapData.value : [];
  return data.find((d) => d.hour === hour && d.day === day)?.count || 0;
};

const getCellColor = (count) => {
  if (count === 0) return "#f9fafb";
  if (count <= 2) return "#d1fae5";
  if (count <= 5) return "#22c55e";
  if (count <= 10) return "#f59e0b";
  return "#ef4444";
};

const getCellTextColor = (count) => {
  if (count === 0) return "#9ca3af";
  if (count <= 5) return "#065f46";
  if (count <= 10) return "#78350f";
  return "#ffffff";
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Reservation Heatmap</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading heatmap...</p>
      </div>
      <div v-else class="heatmap-container">
        <div class="heatmap-card">
          <div class="heatmap-grid">
            <div class="corner-cell"></div>
            <div
              v-for="day in days"
              :key="day"
              class="day-header-cell"
            >
              {{ day }}
            </div>

            <template v-for="hour in hours" :key="hour">
              <div class="time-label-cell">{{ hour }}</div>
              <template v-for="day in days" :key="day + hour">
                <div
                  class="heatmap-cell"
                  :class="{ hovered: hoveredCell === `${hour}-${day}` }"
                  :style="{
                    backgroundColor: getCellColor(getCellCount(hour, day)),
                    color: getCellTextColor(getCellCount(hour, day)),
                  }"
                  :title="`${day} ${hour}: ${getCellCount(hour, day)} reservations`"
                  @mouseenter="hoveredCell = `${hour}-${day}`"
                  @mouseleave="hoveredCell = null"
                >
                  <span v-if="getCellCount(hour, day) > 0" class="cell-count">
                    {{ getCellCount(hour, day) }}
                  </span>
                </div>
              </template>
            </template>
          </div>
        </div>

        <div class="legend-bar">
          <span class="legend-label">Less</span>
          <div class="legend-items">
            <div
              v-for="(count, i) in [0, 2, 5, 10, 15]"
              :key="i"
              class="legend-swatch"
              :style="{
                backgroundColor: getCellColor(count),
                color: getCellTextColor(count),
              }"
            >
              <span v-if="count > 0" class="legend-count">{{ count }}</span>
            </div>
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
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

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.heatmap-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  overflow-x: auto;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  gap: 4px;
  min-width: 640px;
}

.corner-cell {
  background: #fafafa;
  border-radius: 8px;
}

.day-header-cell {
  background: #fafafa;
  text-align: center;
  padding: 10px;
  font-family: "Inter-Bold";
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--secondary-gray);
  border-radius: 8px;
}

.time-label-cell {
  background: #fafafa;
  text-align: center;
  padding: 8px;
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--secondary-gray);
  border-radius: 8px;
}

.heatmap-cell {
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  position: relative;
}

.heatmap-cell:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-blue);
  z-index: 2;
}

.heatmap-cell.hovered {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-blue);
  z-index: 2;
}

.cell-count {
  font-family: "Inter-Bold";
  font-size: 12px;
  font-weight: 700;
}

.legend-bar {
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

.legend-items {
  display: flex;
  gap: 4px;
}

.legend-swatch {
  width: 36px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #f0f0f0;
  font-family: "Inter-Bold";
  font-size: 10px;
}

.legend-count {
  font-size: 10px;
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import reservationAPI from "@/services/reservationAPI";

const props = defineProps({
  from: String,
  to: String,
});

const stats = ref({
  total: 0,
  noShowCount: 0,
  noShowRate: "0.00",
});
const loading = ref(true);
const period = ref("week");

const rateColor = computed(() => {
  const rate = parseFloat(stats.value.noShowRate);
  if (rate < 5) return "#22c55e";
  if (rate < 15) return "#f59e0b";
  return "#ef4444";
});

const loadStats = async () => {
  loading.value = true;
  try {
    const params = {};
    if (props.from) params.from = props.from;
    if (props.to) params.to = props.to;
    if (!props.from && !props.to && period.value !== "custom") {
      // let backend use default period
    }
    const res = await reservationAPI.getReservationStats(params);
    stats.value = res.data.stats;
  } catch (err) {
    console.error("Failed to load no-show stats", err);
  } finally {
    loading.value = false;
  }
};

watch(period, loadStats);
watch(
  () => [props.from, props.to],
  () => {
    if (props.from || props.to) {
      period.value = "custom";
      loadStats();
    }
  }
);

onMounted(loadStats);
</script>

<template>
  <div class="no-show-widget">
    <div class="widget-header">
      <h3 class="widget-title">No-Show Rate</h3>
      <select v-model="period" class="period-select">
        <option value="day">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="custom">Custom</option>
      </select>
    </div>

    <div v-if="loading" class="widget-loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="widget-metrics">
      <div class="metric">
        <span class="metric-label">Total Reservations</span>
        <span class="metric-value">{{ stats.total }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">No-Shows</span>
        <span class="metric-value no-show">{{ stats.noShowCount }}</span>
      </div>
      <div class="metric">
        <span class="metric-label">No-Show Rate</span>
        <span class="metric-value rate" :style="{ color: rateColor }">
          {{ stats.noShowRate }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-show-widget {
  background: var(--restaurant-surface);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--restaurant-charcoal);
  margin: 0;
}

.period-select {
  padding: 6px 10px;
  border: 1px solid var(--restaurant-border);
  border-radius: 6px;
  font-family: "Inter-Medium";
  font-size: 12px;
  background-color: white;
  color: var(--restaurant-charcoal);
}

.widget-loading {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--restaurant-border);
  border-top-color: var(--color-info-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.widget-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-label {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--restaurant-warm-gray);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value {
  font-family: "Inter-Bold";
  font-size: 22px;
  color: var(--restaurant-charcoal);
}

.metric-value.no-show {
  color: #ef4444;
}
</style>

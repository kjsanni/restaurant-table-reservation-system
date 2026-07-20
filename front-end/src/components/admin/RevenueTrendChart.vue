<template>
  <div class="revenue-chart" :class="{ 'is-loading': loading }">
    <canvas ref="canvasEl" role="img" :aria-label="ariaLabel"></canvas>
    <div v-if="loading" class="chart-loading">
      <div class="spinner"></div>
    </div>
    <p v-if="error" class="chart-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

const props = defineProps({
  labels: { type: Array, default: () => [] },
  mrrSeries: { type: Array, default: () => [] },
  tenantSeries: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  ariaLabel: {
    type: String,
    default: "Platform MRR and active tenant trend over time",
  },
});

const canvasEl = ref(null);
let chart = null;

const brand = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  "#000";

const buildConfig = () => ({
  type: "line",
  data: {
    labels: props.labels,
    datasets: [
      {
        label: "Platform MRR",
        data: props.mrrSeries,
        borderColor: brand("--accent-500"),
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(217,119,6,0.12)";
          const g = c.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          g.addColorStop(0, "rgba(217,119,6,0.28)");
          g.addColorStop(1, "rgba(217,119,6,0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: brand("--accent-500"),
        yAxisID: "y",
      },
      {
        label: "Active Tenants",
        data: props.tenantSeries,
        borderColor: brand("--earth-500"),
        backgroundColor: "transparent",
        borderDash: [2, 6],
        fill: false,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: brand("--earth-500"),
        yAxisID: "y1",
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: brand("--ink-muted"),
          usePointStyle: true,
          pointStyle: "line",
          boxWidth: 24,
          padding: 16,
          font: { family: "var(--font-sans)", size: 12 },
        },
      },
      tooltip: {
        backgroundColor: brand("--brand-900"),
        titleColor: "#ffffff",
        bodyColor: "rgba(255,255,255,0.85)",
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: brand("--ink-muted"),
          font: { family: "var(--font-sans)", size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        position: "left",
        grid: { color: brand("--border-subtle") },
        ticks: {
          color: brand("--ink-muted"),
          font: { family: "var(--font-sans)", size: 11 },
          callback: (v) => (v >= 1000 ? `${v / 1000}k` : v),
        },
      },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          color: brand("--ink-muted"),
          font: { family: "var(--font-sans)", size: 11 },
        },
      },
    },
  },
});

const render = () => {
  if (!canvasEl.value) return;
  if (chart) chart.destroy();
  chart = new Chart(canvasEl.value, buildConfig());
};

onMounted(async () => {
  await nextTick();
  render();
});

onBeforeUnmount(() => {
  if (chart) chart.destroy();
});

watch(
  () => [props.labels, props.mrrSeries, props.tenantSeries],
  async () => {
    await nextTick();
    render();
  }
);
</script>

<style scoped>
.revenue-chart {
  position: relative;
  width: 100%;
  height: 260px;
}
.chart-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: var(--surface);
}
.spinner {
  width: 28px;
  height: 28px;
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
.chart-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--rose-600);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>

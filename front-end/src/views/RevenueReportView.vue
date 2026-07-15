<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, computed, onMounted, watch } from "vue";
import reservationAPI from "@/services/reservationAPI";

const loading = ref(true);
const series = ref([]);
const summary = ref({
  totalRevenue: 0,
  totalPayments: 0,
  avgPayment: 0,
});

const granularity = ref("day");
const rangeMode = ref("month");
const customFrom = ref("");
const customTo = ref("");

const presetRanges = {
  today: { label: "Today", days: 1 },
  week: { label: "This Week", days: 7 },
  month: { label: "This Month", days: 30 },
};

const dateRangeLabel = computed(() => {
  if (rangeMode.value === "custom" && customFrom.value && customTo.value) {
    return `${customFrom.value} → ${customTo.value}`;
  }
  return presetRanges[rangeMode.value]?.label || "Custom";
});

const getDateRange = () => {
  if (rangeMode.value === "custom" && customFrom.value && customTo.value) {
    return { from: customFrom.value, to: customTo.value };
  }
  const days = presetRanges[rangeMode.value]?.days || 30;
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
};

const loadReport = async () => {
  loading.value = true;
  try {
    const { from, to } = getDateRange();
    const res = await reservationAPI.getRevenueTimeSeries({
      from,
      to,
      granularity: granularity.value,
    });
    series.value = res.data.series || [];
    summary.value = res.data.summary || summary.value;
  } catch (err) {
    console.error("Failed to load revenue report", err);
  } finally {
    loading.value = false;
  }
};

watch([granularity, rangeMode, customFrom, customTo], () => {
  if (rangeMode.value === "custom" && (!customFrom.value || !customTo.value)) {
    return;
  }
  loadReport();
});

onMounted(loadReport);

const maxTotal = computed(() => {
  if (!series.value.length) return 1;
  return Math.max(...series.value.map((s) => s.total));
});

const exportCSV = () => {
  const headers = [
    "Period",
    "Total Revenue",
    "Transactions",
    "Cash",
    "Card",
    "Transfer",
    "Other",
  ];
  const rows = series.value.map((s) => {
    const cash = s.byMethod?.cash?.total || 0;
    const card = s.byMethod?.card?.total || 0;
    const transfer = s.byMethod?.transfer?.total || 0;
    const other = s.byMethod?.other?.total || 0;
    return [
      s.periodLabel,
      s.total.toFixed(2),
      s.count,
      cash.toFixed(2),
      card.toFixed(2),
      transfer.toFixed(2),
      other.toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenue-report-${dateRangeLabel.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const getMethodColor = (method) => {
  const colors = {
    cash: "#22c55e",
    card: "#3b82f6",
    transfer: "#f59e0b",
    other: "#8b5cf6",
  };
  return colors[method] || "#9ca3af";
};

const getStackedHeight = (amount) => {
  if (!series.value.length) return 0;
  const max = Math.max(...series.value.map((s) => s.total));
  if (max === 0) return 0;
  return (amount / max) * 160;
};

const getStackedY = (item, methodKey) => {
  const methods = Object.keys(item.byMethod || {});
  let y = 180;
  for (let i = 0; i < methods.indexOf(methodKey); i++) {
    const prev = item.byMethod[methods[i]];
    y -= getStackedHeight(prev.total);
  }
  return y;
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Revenue Report"
      subtitle="Financial insights and analytics"
    />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading revenue data...</p>
      </div>

      <div v-else class="report-container">
        <div class="controls-bar">
          <div class="preset-buttons">
            <button
              v-for="(preset, key) in presetRanges"
              :key="key"
              :class="['preset-btn', { active: rangeMode === key }]"
              @click="rangeMode = key"
            >
              {{ preset.label }}
            </button>
          </div>

          <div class="custom-range">
            <input
              v-model="customFrom"
              type="date"
              class="date-input"
              :disabled="rangeMode !== 'custom'"
            />
            <span class="range-separator">→</span>
            <input
              v-model="customTo"
              type="date"
              class="date-input"
              :disabled="rangeMode !== 'custom'"
            />
          </div>

          <select v-model="granularity" class="granularity-select">
            <option value="day">By Day</option>
            <option value="week">By Week</option>
            <option value="month">By Month</option>
          </select>

          <button class="export-btn" @click="exportCSV">Export CSV</button>
        </div>

        <div class="summary-cards">
          <div class="summary-card">
            <span class="summary-label">Total Revenue</span>
            <span class="summary-value"
              >GHS {{ summary.totalRevenue.toFixed(2) }}</span
            >
          </div>
          <div class="summary-card">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ summary.totalPayments }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Avg Transaction</span>
            <span class="summary-value"
              >GHS {{ summary.avgPayment.toFixed(2) }}</span
            >
          </div>
        </div>

        <div class="chart-section">
          <h2 class="section-title">Revenue Over Time</h2>
          <div class="chart-container">
            <svg
              v-if="series.length"
              :viewBox="`0 0 ${series.length * 60} 200`"
              preserveAspectRatio="none"
              class="bar-chart"
            >
              <rect
                v-for="(item, index) in series"
                :key="index"
                :x="index * 60 + 10"
                :y="180 - (item.total / maxTotal) * 160"
                width="40"
                :height="(item.total / maxTotal) * 160"
                fill="#3b82f6"
                rx="4"
              />
              <text
                v-for="(item, index) in series"
                :key="'label-' + index"
                :x="index * 60 + 30"
                y="195"
                text-anchor="middle"
                font-size="10"
                fill="#6b7280"
              >
                {{
                  item.periodLabel.length > 8
                    ? item.periodLabel.slice(0, 8)
                    : item.periodLabel
                }}
              </text>
            </svg>
            <div v-else class="empty-chart">
              No revenue data for selected period
            </div>
          </div>
        </div>

        <div class="chart-section">
          <h2 class="section-title">Revenue by Payment Method</h2>
          <div class="method-legend">
            <span class="legend-item"
              ><span class="legend-color" style="background: #22c55e"></span
              >Cash</span
            >
            <span class="legend-item"
              ><span class="legend-color" style="background: #3b82f6"></span
              >Card</span
            >
            <span class="legend-item"
              ><span class="legend-color" style="background: #f59e0b"></span
              >Transfer</span
            >
            <span class="legend-item"
              ><span class="legend-color" style="background: #8b5cf6"></span
              >Other</span
            >
          </div>
          <div class="chart-container stacked">
            <svg
              v-if="series.length"
              :viewBox="`0 0 ${series.length * 60} 200`"
              preserveAspectRatio="none"
              class="bar-chart"
            >
              <g v-for="(item, index) in series" :key="index">
                <rect
                  v-for="(methodData, methodKey, mIndex) in item.byMethod"
                  :key="methodKey"
                  :x="index * 60 + 10"
                  :y="getStackedY(item, methodKey, mIndex)"
                  width="40"
                  :height="getStackedHeight(methodData.total)"
                  :fill="getMethodColor(methodKey)"
                  rx="4"
                />
              </g>
              <text
                v-for="(item, index) in series"
                :key="'slabel-' + index"
                :x="index * 60 + 30"
                y="195"
                text-anchor="middle"
                font-size="10"
                fill="#6b7280"
              >
                {{
                  item.periodLabel.length > 8
                    ? item.periodLabel.slice(0, 8)
                    : item.periodLabel
                }}
              </text>
            </svg>
            <div v-else class="empty-chart">
              No revenue data for selected period
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--border);
}

}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--space-6);
  margin-right: var(--space-6);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--color-info-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.controls-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.preset-buttons {
  display: flex;
  gap: 8px;
}

.preset-btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-btn:hover {
  background: #f3f4f6;
}

.preset-btn.active {
  background: var(--color-info-600);
  color: white;
  border-color: var(--color-info-600);
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--ink);
}

.date-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
}

.range-separator {
  color: var(--ink-muted);
  font-size: 14px;
}

.granularity-select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: "Inter-Medium";
  font-size: 13px;
  background: white;
  color: var(--ink);
  margin-left: auto;
}

.export-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.export-btn:hover {
  background: #15803d;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-value {
  font-family: "Inter-Bold";
  font-size: 24px;
  color: var(--ink);
}

.chart-section {
  background: white;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--ink);
  margin: 0 0 20px 0;
}

.chart-container {
  width: 100%;
  overflow-x: auto;
}

.chart-container svg {
  width: 100%;
  height: 220px;
}

.empty-chart {
  text-align: center;
  padding: 40px;
  color: var(--ink-muted);
  font-family: "Inter-Light";
}

.method-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--ink);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}
</style>

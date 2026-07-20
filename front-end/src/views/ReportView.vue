<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import reportAPI from "@/services/reportAPI";
import logger from "@/utils/logger";
import { useCurrency } from "@/composables/useCurrency";

const { format: fmt } = useCurrency();

type Tab = "reservations" | "orders";
const activeTab = ref<Tab>("reservations");

const reservationReport = ref<any | null>(null);
const orderStats = ref<any | null>(null);
const topItems = ref<any[]>([]);
const loading = ref(true);
const from = ref("");
const to = ref("");

const coversBySource = computed(() => {
  if (!reservationReport.value?.coversBySource) return [];
  const total = Object.values(reservationReport.value.coversBySource).reduce(
    (sum: number, val: any) => sum + (Number(val) || 0),
    0
  );
  return Object.entries(reservationReport.value.coversBySource).map(
    ([label, value]: [string, any]) => ({
      label,
      value: Number(value) || 0,
      percent: total > 0 ? Math.round((Number(value) / total) * 100) : 0,
    })
  );
});

const loadReservationReport = async () => {
  loading.value = true;
  try {
    const res = await reportAPI.getReservationReport({
      from: from.value,
      to: to.value,
    });
    reservationReport.value = res.data?.report || null;
  } catch (err) {
    logger.error("Failed to load reservation report", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadOrderStats = async () => {
  loading.value = true;
  try {
    const [statsRes, itemsRes] = await Promise.all([
      reportAPI.getOrderStats({ from: from.value, to: to.value }),
      reportAPI.getTopSellingItems({ from: from.value, to: to.value }),
    ]);
    orderStats.value = statsRes.data?.stats || null;
    topItems.value = itemsRes.data?.items || [];
  } catch (err) {
    logger.error("Failed to load order report", { error: err });
  } finally {
    loading.value = false;
  }
};

const loadReport = async () => {
  if (activeTab.value === "reservations") {
    await loadReservationReport();
  } else {
    await loadOrderStats();
  }
};

const exportCSV = async () => {
  try {
    const res =
      activeTab.value === "reservations"
        ? await reportAPI.exportCSV({ from: from.value, to: to.value })
        : await reportAPI.exportOrderCSV({ from: from.value, to: to.value });
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      activeTab.value === "reservations" ? "reservations.csv" : "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    logger.error("Failed to export CSV", { error: err });
  }
};

const exportPDF = async () => {
  try {
    const res =
      activeTab.value === "reservations"
        ? await reportAPI.exportPDF({ from: from.value, to: to.value })
        : await reportAPI.exportOrderPDF({ from: from.value, to: to.value });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      activeTab.value === "reservations" ? "reservations.pdf" : "orders.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    logger.error("Failed to export PDF", { error: err });
  }
};

onMounted(loadReport);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Reports</h1>
        <p>Covers, revenue, and performance trends</p>
      </div>
      <div class="topbar-right">
        <button class="btn-secondary" @click="exportCSV">Export CSV</button>
        <button class="btn-primary" @click="exportPDF">Export PDF</button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="controls">
        <div class="tabs">
          <button
            :class="['tab', activeTab === 'reservations' && 'active']"
            @click="
              activeTab = 'reservations';
              loadReport();
            "
          >
            Reservations
          </button>
          <button
            :class="['tab', activeTab === 'orders' && 'active']"
            @click="
              activeTab = 'orders';
              loadReport();
            "
          >
            Orders
          </button>
        </div>
        <div class="filters">
          <input v-model="from" type="date" />
          <input v-model="to" type="date" />
          <button class="btn-small" @click="loadReport">Apply</button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reports...</p>
      </div>

      <template v-else-if="activeTab === 'reservations' && reservationReport">
        <div class="kpi-strip">
          <div class="kpi-tile">
            <div class="kpi-label">Total Covers</div>
            <div class="kpi-value">
              {{ reservationReport.totalCovers?.toLocaleString() || "—" }}
            </div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">
              {{
                reservationReport.revenue
                  ? `GHS ${(reservationReport.revenue / 1000).toFixed(1)}k`
                  : "—"
              }}
            </div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Avg Party</div>
            <div class="kpi-value">
              {{ reservationReport.avgParty?.toFixed(1) || "—" }}
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Covers by Source</h3>
          <div v-for="item in coversBySource" :key="item.label" class="bar-row">
            <div class="bar-label">{{ item.label }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: item.percent + '%' }"
              ></div>
            </div>
            <div class="bar-value">{{ item.percent }}%</div>
          </div>
          <div v-if="!coversBySource.length" class="empty-state">
            No source data available
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'orders' && orderStats">
        <div class="kpi-strip">
          <div class="kpi-tile">
            <div class="kpi-label">Total Orders</div>
            <div class="kpi-value">
              {{ orderStats.totalOrders?.toLocaleString() || "—" }}
            </div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">
              {{
                orderStats.totalRevenue
                  ? `GHS ${orderStats.totalRevenue.toLocaleString()}`
                  : "—"
              }}
            </div>
          </div>
          <div class="kpi-tile">
            <div class="kpi-label">Avg Order Value</div>
            <div class="kpi-value">
              {{
                orderStats.avgOrderValue
                  ? `GHS ${orderStats.avgOrderValue.toFixed(2)}`
                  : "—"
              }}
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Status Breakdown</h3>
          <div
            v-for="item in orderStats.statusBreakdown"
            :key="item.status"
            class="bar-row"
          >
            <div class="bar-label">{{ item.status }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width:
                    (orderStats.totalOrders
                      ? (item.count / orderStats.totalOrders) * 100
                      : 0) + '%',
                }"
              ></div>
            </div>
            <div class="bar-value">{{ item.count }}</div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Payment Breakdown</h3>
          <div
            v-for="item in orderStats.paymentBreakdown"
            :key="item.status"
            class="bar-row"
          >
            <div class="bar-label">{{ item.status }}</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width:
                    (orderStats.totalOrders
                      ? (item.count / orderStats.totalOrders) * 100
                      : 0) + '%',
                }"
              ></div>
            </div>
            <div class="bar-value">{{ item.count }}</div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Top Selling Items</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in topItems" :key="item.menuItemId">
                <td>{{ item.name }}</td>
                <td>{{ item.totalQuantity }}</td>
                <td>{{ fmt(item.totalRevenue) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!topItems.length" class="empty-state">
            No order data available
          </div>
        </div>
      </template>

      <div v-else class="empty-state">No report data available.</div>
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

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
}

.tab {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.tab.active {
  background: var(--accent);
  color: white;
  box-shadow: var(--shadow-sm);
}

.tab:hover:not(.active) {
  color: var(--ink);
}

.filters {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.filters input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
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

.chart-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  margin-bottom: 22px;
}

.chart-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.bar-label {
  width: 70px;
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-700);
  font-family: var(--font-sans);
}

.bar-track {
  flex: 1;
  height: 10px;
  background: var(--neutral-100);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-400), var(--accent-500));
  transition: width 0.6s ease;
}

.bar-value {
  width: 50px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-900);
  font-family: var(--font-sans);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  font-weight: 600;
  color: var(--ink-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.btn-secondary {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 13px;
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

.btn-small {
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-in-out);
}

.btn-small:hover {
  background: var(--accent-hover);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { VaSelect, VaDataTable, VaButton } from "vuestic-ui";
import reservationAPI from "@/services/reservationAPI";

const loading = ref(true);
const reservations = ref([]);
const summary = ref({
  deposit: 0,
  partial: 0,
  paid: 0,
  unpaid: 0,
});

const paymentStatusOrder = ["unpaid", "deposit", "partial", "paid"];

const paymentDisplayLabels = {
  unpaid: "Unpaid",
  deposit: "Deposit",
  partial: "Partial Payment",
  paid: "Full Payment",
};

const paymentBarColors = {
  unpaid: "#9ca3af",
  deposit: "#3b82f6",
  partial: "#f59e0b",
  paid: "#22c55e",
};

const filterPaymentStatus = ref(null);
const filterResStatus = ref(null);
const sortField = ref("id");
const sortDirection = ref("desc");

const filteredReservations = computed(() => {
  let data = [...reservations.value];
  if (filterPaymentStatus.value) {
    data = data.filter((r) => r.paymentStatus === filterPaymentStatus.value);
  }
  if (filterResStatus.value) {
    data = data.filter((r) => r.resStatus === filterResStatus.value);
  }
  data.sort((a, b) => {
    const aVal = a[sortField.value] ?? "";
    const bVal = b[sortField.value] ?? "";
    if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });
  return data;
});

const totalReservations = computed(() => {
  return Object.values(summary.value).reduce((sum, count) => sum + count, 0);
});

const maxCount = computed(() => {
  return Math.max(...Object.values(summary.value), 1);
});

const barWidth = (status) => {
  return `${(summary.value[status] / maxCount.value) * 100}%`;
};

const tableFields = {
  id: "ID",
  name: "Customer",
  resDate: "Date",
  resTime: "Time",
  people: "People",
  resStatus: "Status",
  paymentStatus: "Payment",
};

const loadData = async () => {
  loading.value = true;
  try {
    const [resRes, summaryRes] = await Promise.all([
      reservationAPI.getReservations(),
      reservationAPI.getPaymentSummary(),
    ]);
    reservations.value = resRes.data.collection;
    summary.value = summaryRes.data.summary;
  } catch (err) {
    console.error("Failed to load payment dashboard", err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Payment Dashboard</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>
      <div v-else class="dashboard-container">
        <div class="summary-section">
          <div class="summary-card total">
            <div class="summary-icon">💰</div>
            <div class="summary-content">
              <span class="summary-label">Total Reservations</span>
              <span class="summary-value">{{ totalReservations }}</span>
            </div>
          </div>
          <div
            v-for="status in paymentStatusOrder"
            :key="status"
            class="summary-card"
            :class="status"
          >
            <div class="summary-content">
              <span class="summary-label">{{
                paymentDisplayLabels[status]
              }}</span>
              <span class="summary-value">{{ summary[status] }}</span>
            </div>
            <div
              class="summary-indicator"
              :style="{ backgroundColor: paymentBarColors[status] }"
            ></div>
          </div>
        </div>

        <div class="dashboard-card chart-card">
          <h2 class="card-title">Payment Distribution</h2>
          <div class="bar-chart">
            <div
              v-for="status in paymentStatusOrder"
              :key="status"
              class="bar-row"
            >
              <div class="bar-label">{{ paymentDisplayLabels[status] }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: barWidth(status),
                    backgroundColor: paymentBarColors[status],
                  }"
                ></div>
                <span class="bar-value">{{ summary[status] }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card table-card">
          <h2 class="card-title">Reservation Details</h2>
          <div class="filters">
            <VaSelect
              v-model="filterPaymentStatus"
              placeholder="All Payment Statuses"
              :options="
                paymentStatusOrder.map((s) => ({
                  label: paymentDisplayLabels[s],
                  value: s,
                }))
              "
              clearable
            />
            <VaSelect
              v-model="filterResStatus"
              placeholder="All Reservation Statuses"
              :options="
                ['pending', 'seated', 'missed', 'cancelled'].map((s) => ({
                  label: s.charAt(0).toUpperCase() + s.slice(1),
                  value: s,
                }))
              "
              clearable
            />
          </div>
          <VaDataTable
            :items="filteredReservations"
            :columns="
              Object.keys(tableFields).map((key) => ({
                key,
                label: tableFields[key],
              }))
            "
          />
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
  padding: 80px 20px;
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

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: var(--card-padding);
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.summary-card.total {
  background-color: #1f2937;
  color: white;
  border-color: #1f2937;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-family: "Inter-Light";
  font-size: 13px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card.total .summary-label {
  color: #d1d5db;
}

.summary-value {
  font-family: "Inter-Bold";
  font-size: 28px;
  color: var(--primary-black);
}

.summary-card.total .summary-value {
  color: white;
}

.summary-indicator {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dashboard-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.chart-card {
  margin-bottom: 4px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-label {
  width: 140px;
  text-align: right;
  font-size: 14px;
  font-family: "Inter-Medium";
  color: var(--primary-black);
}

.bar-track {
  flex: 1;
  height: 36px;
  background-color: #f3f4f6;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-value {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--primary-black);
  z-index: 1;
}

.table-card .filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 14px;
}

@media screen and (min-width: 640px) {
  .summary-section {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
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

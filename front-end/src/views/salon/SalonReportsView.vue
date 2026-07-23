<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonReportsAPI from "@/services/salonReportsAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const saving = ref(false);
const from = ref("");
const to = ref("");

const summary = ref({
  totalRevenue: 0,
  totalAppointments: 0,
  dateRange: { from: null, to: null },
});
const revenueByService = ref<any[]>([]);
const topStylists = ref<any[]>([]);
const appointmentsBySource = ref<any[]>([]);
const peakHours = ref<any[]>([]);

const loadReports = async () => {
  loading.value = true;
  try {
    const res = await salonReportsAPI.getRevenueByService(
      from.value || undefined,
      to.value || undefined
    );
    const data = res.data;
    summary.value = data.summary || summary.value;
    revenueByService.value = data.revenueByService || [];
    topStylists.value = data.topStylists || [];
    appointmentsBySource.value = data.appointmentsBySource || [];
    peakHours.value = data.peakHours || [];
  } catch (err) {
    logger.error("Failed to load salon reports", { error: err });
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  loadReports();
};

onMounted(loadReports);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Reports</h1>
        <p>Revenue, top stylists, and appointment source breakdown</p>
      </div>
      <div class="topbar-filters">
        <label>
          From
          <input v-model="from" type="date" />
        </label>
        <label>
          To
          <input v-model="to" type="date" />
        </label>
        <button class="btn-primary" :disabled="saving" @click="applyFilters">
          Apply
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading reports...</p>
      </div>

      <div v-else class="reports-stack">
        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-label">Total Revenue</span>
            <span class="summary-value">{{
              summary.totalRevenue.toLocaleString()
            }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Total Appointments</span>
            <span class="summary-value">{{ summary.totalAppointments }}</span>
          </div>
        </div>

        <div class="report-section">
          <h3>Revenue by Service</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Appointments</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in revenueByService" :key="item.serviceId">
                <td>{{ item.serviceName }}</td>
                <td>{{ item.appointmentCount }}</td>
                <td>{{ item.revenue.toLocaleString() }}</td>
              </tr>
              <tr v-if="!revenueByService.length">
                <td colspan="3" class="empty-state">
                  No revenue data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>Top Stylists</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Stylist</th>
                <th>Appointments</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in topStylists" :key="item.stylistId">
                <td>{{ item.stylistName }}</td>
                <td>{{ item.appointmentCount }}</td>
                <td>{{ item.revenue.toLocaleString() }}</td>
              </tr>
              <tr v-if="!topStylists.length">
                <td colspan="3" class="empty-state">
                  No stylist data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>Appointments by Source</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Appointments</th>
                <th>Total Minutes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in appointmentsBySource" :key="item.source">
                <td>{{ item.source }}</td>
                <td>{{ item.appointmentCount }}</td>
                <td>{{ item.totalMinutes }}</td>
              </tr>
              <tr v-if="!appointmentsBySource.length">
                <td colspan="3" class="empty-state">
                  No source data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>Peak Hours</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Hour</th>
                <th>Appointments</th>
                <th>Total Minutes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in peakHours"
                :key="`${item.dayOfWeek}-${item.hour}`"
              >
                <td>{{ item.dayOfWeek }}</td>
                <td>{{ String(item.hour).padStart(2, "0") }}:00</td>
                <td>{{ item.appointmentCount }}</td>
                <td>{{ item.totalMinutes }}</td>
              </tr>
              <tr v-if="!peakHours.length">
                <td colspan="4" class="empty-state">
                  No peak-hour data available
                </td>
              </tr>
            </tbody>
          </table>
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
  flex-wrap: wrap;
  gap: 12px;
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
.topbar-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar-filters label {
  font-size: 12px;
  color: var(--neutral-700);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.topbar-filters input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
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
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.reports-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.summary-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.summary-label {
  display: block;
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.summary-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-top: 6px;
}
.report-section {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 18px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.report-section h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--neutral-900);
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.report-table th,
.report-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--neutral-200);
}
.report-table th {
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 18px;
}
</style>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.reports") }}</h1>
        <p>{{ t("salon.reportsSubtitle") }}</p>
      </div>
      <div class="topbar-filters">
        <label>
          {{ t("salon.from") }}
          <input v-model="from" type="date" />
        </label>
        <label>
          {{ t("salon.to") }}
          <input v-model="to" type="date" />
        </label>
        <button
          class="btn-primary"
          :disabled="exporting || loading"
          @click="applyFilters"
        >
          {{ t("salon.apply") }}
        </button>
        <button
          class="btn-secondary"
          :disabled="exporting || loading"
          @click="exportCsv"
        >
          {{
            exporting
              ? t("salon.exporting", "Exporting...")
              : t("salon.exportCsv", "Export CSV")
          }}
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingReports") }}</p>
      </div>

      <div v-else class="reports-stack">
        <div class="summary-grid">
          <div class="summary-card">
            <span class="summary-label">{{ t("salon.totalRevenue") }}</span>
            <span class="summary-value">{{
              summary.totalRevenue.toLocaleString()
            }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">{{
              t("salon.totalAppointments")
            }}</span>
            <span class="summary-value">{{ summary.totalAppointments }}</span>
          </div>
        </div>

        <div class="report-section">
          <h3>{{ t("salon.revenueByService") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.service") }}</th>
                <th>{{ t("salon.appointments") }}</th>
                <th>{{ t("salon.revenue") }}</th>
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
                  {{ t("salon.noRevenueData", "No revenue data available") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>{{ t("salon.topStylists") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.stylist") }}</th>
                <th>{{ t("salon.appointments") }}</th>
                <th>{{ t("salon.revenue") }}</th>
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
                  {{ t("salon.noStylistData") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>{{ t("salon.appointmentsBySource") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.source") }}</th>
                <th>{{ t("salon.appointments") }}</th>
                <th>{{ t("salon.totalMinutes") }}</th>
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
                  {{ t("salon.noSourceData") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <h3>{{ t("salon.peakHours") }}</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.day") }}</th>
                <th>{{ t("salon.hour") }}</th>
                <th>{{ t("salon.appointments") }}</th>
                <th>{{ t("salon.totalMinutes", "Total Minutes") }}</th>
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
                  {{ t("salon.noPeakHourData", "No peak-hour data available") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-section">
          <div class="section-header">
            <h3>
              {{ t("salon.scheduledReports", "Scheduled Email Reports") }}
            </h3>
            <button class="btn-primary" @click="showScheduleForm = true">
              {{ t("salon.scheduleReport", "Schedule Report") }}
            </button>
          </div>
          <div v-if="scheduledLoading" class="loading-state-inline">
            <div class="spinner-sm"></div>
          </div>
          <div v-else-if="!scheduledReports.length" class="empty-state">
            {{ t("salon.noScheduledReports", "No scheduled reports") }}
          </div>
          <table v-else class="report-table">
            <thead>
              <tr>
                <th>{{ t("salon.name") }}</th>
                <th>{{ t("salon.reportType") }}</th>
                <th>{{ t("salon.frequency") }}</th>
                <th>{{ t("salon.recipients") }}</th>
                <th>{{ t("salon.nextRun") }}</th>
                <th>{{ t("salon.actions") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="report in scheduledReports" :key="report.id">
                <td>{{ report.name }}</td>
                <td>{{ report.reportType }}</td>
                <td>{{ report.frequency }}</td>
                <td>{{ (report.recipients || []).join(", ") }}</td>
                <td>
                  {{
                    report.nextRunAt
                      ? new Date(report.nextRunAt).toLocaleString()
                      : "—"
                  }}
                </td>
                <td class="actions-cell">
                  <button
                    class="btn-sm"
                    :disabled="runningId === report.id"
                    @click="runScheduledReport(report.id)"
                  >
                    {{ runningId === report.id ? "Running..." : "Run" }}
                  </button>
                  <button
                    class="btn-sm btn-danger"
                    @click="deleteScheduledReport(report.id)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="showScheduleForm"
      class="modal-overlay"
      @click.self="showScheduleForm = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ t("salon.scheduleReport", "Schedule Email Report") }}</h3>
          <button class="btn-close" @click="showScheduleForm = false">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>{{ t("salon.reportName", "Report Name") }}</label>
            <input v-model="scheduleForm.name" class="field-input" />
          </div>
          <div class="field">
            <label>{{ t("salon.reportType") }}</label>
            <select v-model="scheduleForm.reportType" class="field-input">
              <option value="salon_revenue">Revenue</option>
              <option value="salon_appointments">Appointments</option>
              <option value="salon_stylists">Stylists</option>
              <option value="salon_inventory">Inventory</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t("salon.frequency") }}</label>
            <select v-model="scheduleForm.frequency" class="field-input">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div v-if="scheduleForm.frequency === 'weekly'" class="field">
            <label>{{ t("salon.dayOfWeek", "Day of Week") }}</label>
            <select v-model="scheduleForm.frequencyDay" class="field-input">
              <option :value="0">Sunday</option>
              <option :value="1">Monday</option>
              <option :value="2">Tuesday</option>
              <option :value="3">Wednesday</option>
              <option :value="4">Thursday</option>
              <option :value="5">Friday</option>
              <option :value="6">Saturday</option>
            </select>
          </div>
          <div class="field">
            <label>{{ t("salon.time", "Time") }}</label>
            <input
              v-model="scheduleForm.frequencyTime"
              type="time"
              class="field-input"
            />
          </div>
          <div class="field">
            <label>{{ t("salon.recipients") }}</label>
            <input
              v-model="scheduleForm.recipients"
              class="field-input"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showScheduleForm = false">
              {{ t("salon.cancel", "Cancel") }}
            </button>
            <button
              class="btn-primary"
              :disabled="saving"
              @click="createScheduledReport"
            >
              {{
                saving
                  ? t("salon.saving", "Saving...")
                  : t("salon.save", "Save")
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import salonReportsAPI from "@/services/salonReportsAPI";
import logger from "@/utils/logger";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

const loading = ref(true);
const exporting = ref(false);
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

const scheduledReports = ref<any[]>([]);
const scheduledLoading = ref(false);
const showScheduleForm = ref(false);
const scheduleForm = ref({
  name: "",
  reportType: "salon_revenue",
  frequency: "weekly",
  frequencyDay: 1,
  frequencyTime: "08:00",
  recipients: "",
});
const runningId = ref<number | null>(null);
const saving = ref(false);

const withLoading = async (loadingRef, action) => {
  loadingRef.value = true;
  try {
    await action();
  } finally {
    loadingRef.value = false;
  }
};

const downloadBlob = (data: string, filename: string) => {
  const blob = new Blob([data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const loadReports = async () => {
  await withLoading(loading, async () => {
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
  });
};

const applyFilters = () => {
  loadReports();
};

const exportCsv = async () => {
  await withLoading(exporting, async () => {
    const res = await salonReportsAPI.exportCsv(
      from.value || undefined,
      to.value || undefined
    );
    downloadBlob(
      res.data,
      `salon-reports-${new Date().toISOString().slice(0, 10)}.csv`
    );
  });
};

const loadScheduledReports = async () => {
  await withLoading(scheduledLoading, async () => {
    const res = await salonReportsAPI.listScheduledReports();
    scheduledReports.value = res.data?.collection || [];
  });
};

const buildScheduledReportPayload = () => {
  const recipients = scheduleForm.value.recipients
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return {
    name: scheduleForm.value.name,
    reportType: scheduleForm.value.reportType,
    format: "csv",
    frequency: scheduleForm.value.frequency,
    frequencyDay:
      scheduleForm.value.frequency === "weekly"
        ? scheduleForm.value.frequencyDay
        : undefined,
    frequencyTime: scheduleForm.value.frequencyTime,
    recipients,
  };
};

const resetScheduleForm = () => {
  scheduleForm.value = {
    name: "",
    reportType: "salon_revenue",
    frequency: "weekly",
    frequencyDay: 1,
    frequencyTime: "08:00",
    recipients: "",
  };
};

const createScheduledReport = async () => {
  await withLoading(saving, async () => {
    await salonReportsAPI.createScheduledReport(buildScheduledReportPayload());
    showScheduleForm.value = false;
    resetScheduleForm();
    await loadScheduledReports();
  });
};

const deleteScheduledReport = async (id: number) => {
  if (!confirm("Delete this scheduled report?")) return;
  try {
    await salonReportsAPI.deleteScheduledReport(id);
    await loadScheduledReports();
  } catch (err) {
    logger.error("Failed to delete scheduled report", { error: err });
  }
};

const runScheduledReport = async (id: number) => {
  runningId.value = id;
  try {
    await salonReportsAPI.runScheduledReport(id);
    await loadScheduledReports();
  } catch (err) {
    logger.error("Failed to run scheduled report", { error: err });
  } finally {
    runningId.value = null;
  }
};

onMounted(() => {
  loadReports();
  loadScheduledReports();
});
</script>

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
.btn-primary {
  background: linear-gradient(135deg, var(--sky-600) 0%, var(--sky-500) 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--sky-700) 0%, var(--sky-600) 100%);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-900);
  border: 1px solid var(--neutral-200);
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--neutral-200);
}
.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-header h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: 18px;
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
  background: var(--white);
  color: var(--neutral-900);
  cursor: pointer;
  font-weight: 600;
}
.btn-sm:hover:not(:disabled) {
  background: var(--neutral-100);
}
.btn-sm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-danger {
  border-color: #fca5a5;
  color: #dc2626;
}
.btn-danger:hover:not(:disabled) {
  background: #fef2f2;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  margin: var(--space-6);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--neutral-200);
}
.modal-header h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 700;
}
.modal-body {
  padding: var(--space-5) var(--space-6) var(--space-6);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.field-input {
  width: 100%;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: var(--space-5);
}
</style>

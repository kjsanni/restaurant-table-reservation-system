<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted } from "vue";
import { VaSwitch, VaButton, VaCard, VaCardContent, VaModal } from "vuestic-ui";
import scheduleAPI from "@/services/scheduleAPI";
import logger from "@/utils/logger";

const schedules = ref([]);
const holidays = ref([]);
const loading = ref(true);
const showHolidayDialog = ref(false);
const newHoliday = ref({
  date: "",
  description: "",
  isClosed: true,
  openTime: "",
  closeTime: "",
});

const days = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

onMounted(async () => {
  await loadSchedule();
});

const loadSchedule = async () => {
  loading.value = true;
  try {
    const res = await scheduleAPI.getSchedules();
    schedules.value = days.map((day) => {
      const schedule = res.data.schedules.find(
        (s) => s.dayOfWeek === day.value
      );
      return {
        id: schedule?.id,
        dayOfWeek: day.value,
        label: day.label,
        openTime: schedule?.openTime || "11:00:00",
        closeTime: schedule?.closeTime || "23:00:00",
        isClosed: schedule?.isClosed || false,
        slotDuration: schedule?.slotDuration || 30,
      };
    });
    const holidaysRes = await scheduleAPI.getHolidays();
    holidays.value = holidaysRes.data.holidays;
  } catch (err) {
    logger.error("Failed to load schedule", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const updateSchedule = async (schedule) => {
  await scheduleAPI.updateSchedule(schedule.id, {
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    isClosed: schedule.isClosed,
    slotDuration: schedule.slotDuration,
  });
};

const createHoliday = async () => {
  await scheduleAPI.createHoliday({
    date: newHoliday.value.date,
    description: newHoliday.value.description,
    isClosed: newHoliday.value.isClosed,
    openTime: newHoliday.value.isClosed ? null : newHoliday.value.openTime,
    closeTime: newHoliday.value.isClosed ? null : newHoliday.value.closeTime,
  });
  showHolidayDialog.value = false;
  newHoliday.value = {
    date: "",
    description: "",
    isClosed: true,
    openTime: "",
    closeTime: "",
  };
  await loadSchedule();
};

const deleteHoliday = async (id) => {
  await scheduleAPI.deleteHoliday(id);
  await loadSchedule();
};

const exportCSV = async () => {
  const res = await scheduleAPI.exportScheduleCSV();
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "schedule.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const exportPDF = async () => {
  try {
    const res = await scheduleAPI.exportSchedulePDF();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "schedule.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Failed to export PDF:", err);
    alert("Failed to export PDF. Please try again.");
  }
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Schedule" />
    <div class="content-wrapper">
      <div class="action-bar">
        <div class="export-bar">
          <button class="btn btn-primary" @click="exportCSV">Export CSV</button>
          <button class="btn btn-secondary" @click="exportPDF">
            Export PDF
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>
      <div v-else class="schedules-container">
        <div class="section-card weekly-card">
          <h2 class="section-title">Weekly Hours</h2>
          <div class="schedule-list">
            <div
              v-for="schedule in schedules"
              :key="schedule.dayOfWeek"
              class="schedule-item"
            >
              <div class="day-label">{{ schedule.label }}</div>
              <div class="time-inputs">
                <input
                  type="time"
                  v-model="schedule.openTime"
                  :disabled="schedule.isClosed"
                  @change="updateSchedule(schedule)"
                  class="time-input"
                />
                <span class="time-separator">to</span>
                <input
                  type="time"
                  v-model="schedule.closeTime"
                  :disabled="schedule.isClosed"
                  @change="updateSchedule(schedule)"
                  class="time-input"
                />
              </div>
              <div class="schedule-actions">
                <span v-if="!schedule.isClosed" class="slot-badge">
                  {{ schedule.slotDuration }} min slots
                </span>
                <VaSwitch
                  v-model="schedule.isClosed"
                  @change="updateSchedule(schedule)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section-card holidays-card">
          <div class="holidays-header">
            <h2 class="section-title">Holidays</h2>
            <button
              class="btn btn-primary btn-sm"
              @click="showHolidayDialog = true"
            >
              Add Holiday
            </button>
          </div>
          <div v-if="holidays.length === 0" class="empty-state">
            No holidays configured.
          </div>
          <div class="holiday-list">
            <div
              v-for="holiday in holidays"
              :key="holiday.id"
              class="holiday-item"
            >
              <div class="holiday-info">
                <span class="holiday-date">{{ holiday.date }}</span>
                <span class="holiday-desc">{{ holiday.description }}</span>
                <span v-if="holiday.isClosed" class="closed-badge">Closed</span>
                <span v-else class="open-badge">Open</span>
              </div>
              <button
                class="btn btn-danger btn-sm"
                @click="deleteHoliday(holiday.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <VaModal v-model="showHolidayDialog" title="Add Holiday" size="small">
        <VaCard>
          <VaCardContent>
            <div class="field">
              <label class="field-label">Date</label>
              <input
                type="date"
                v-model="newHoliday.date"
                class="field-input"
              />
            </div>
            <div class="field">
              <label class="field-label">Description</label>
              <input
                type="text"
                v-model="newHoliday.description"
                placeholder="Holiday description"
                class="field-input"
              />
            </div>
            <div class="field">
              <label class="field-label">Closed</label>
              <VaSwitch v-model="newHoliday.isClosed" />
            </div>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showHolidayDialog = false"
              >Cancel</VaButton
            >
            <VaButton preset="primary" @click="createHoliday">Save</VaButton>
          </template>
        </VaCard>
      </VaModal>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-6);
}

.export-bar {
  display: flex;
  gap: var(--space-3);
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

.schedules-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
  letter-spacing: var(--tracking-tight);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--neutral-50);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-in-out);
}

.schedule-item:hover {
  background: var(--neutral-100);
}

.day-label {
  font-family: var(--font-sans);
  font-weight: 600;
  width: 110px;
  font-size: var(--text-sm);
  color: var(--ink);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.time-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  min-width: 140px;
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}

.time-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.time-input:disabled {
  background: var(--neutral-100);
  color: var(--ink-secondary);
  cursor: not-allowed;
}

.time-separator {
  color: var(--ink-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
}

.schedule-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.slot-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--sky-600);
  background: var(--neutral-100);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.holidays-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.holiday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  background: var(--neutral-50);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.holiday-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.holiday-date {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.holiday-desc {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.closed-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--rose-50);
  color: var(--rose-600);
}

.open-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--earth-50);
  color: var(--earth-600);
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.field {
  margin-bottom: var(--space-5);
}

.field:last-of-type {
  margin-bottom: 0;
}

.field-label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 600;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out),
    background-color var(--duration-fast) var(--ease-in-out);
  background: var(--neutral-50);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  background: var(--surface);
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>

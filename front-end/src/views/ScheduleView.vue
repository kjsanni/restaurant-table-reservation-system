<script setup>
import { ref, onMounted } from "vue";
import PopupBox from "@/components/PopupBox.vue";
import ToggleSwitch from "@/components/ToggleSwitch.vue";
import scheduleAPI from "@/services/scheduleAPI";

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
  const res = await scheduleAPI.exportSchedulePDF();
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "schedule.html");
  document.body.appendChild(link);
  link.click();
  link.remove();
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Restaurant Schedule</h1>
    </div>
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
                <ToggleSwitch
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

      <div v-if="showHolidayDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Add Holiday</h3>
          <div class="field">
            <label class="field-label">Date</label>
            <input type="date" v-model="newHoliday.date" class="field-input" />
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
            <ToggleSwitch v-model="newHoliday.isClosed" />
          </div>
          <div class="modal-actions">
            <button
              class="btn btn-secondary"
              @click="showHolidayDialog = false"
            >
              Cancel
            </button>
            <button class="btn btn-primary" @click="createHoliday">Save</button>
          </div>
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

.action-bar {
  margin-bottom: 20px;
}

.export-bar {
  display: flex;
  gap: 10px;
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

.schedules-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
}

.day-label {
  font-family: "Inter-Medium";
  width: 110px;
  font-size: 14px;
  color: var(--primary-black);
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.time-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  background: white;
  min-width: 140px;
}

.time-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.time-input:disabled {
  background: #f3f4f6;
  color: var(--secondary-gray);
  cursor: not-allowed;
}

.time-separator {
  color: var(--secondary-gray);
  font-size: 13px;
  font-family: "Inter-Medium");
}

.schedule-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slot-badge {
  font-family: "Inter-Medium";
  font-size: 12px;
  color: var(--primary-blue);
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 6px;
}

.holidays-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.holiday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
}

.holiday-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.holiday-date {
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

.holiday-desc {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
}

.closed-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  background-color: #fef2f2;
  color: #dc2626;
  font-family: "Inter-Medium";
}

.open-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  background-color: #d1fae5;
  color: #065f46;
  font-family: "Inter-Medium";
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 14px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.15s;
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  padding: 24px;
  border-radius: 14px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

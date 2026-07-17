<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted, computed } from "vue";
import { VaSwitch, VaButton, VaCard, VaCardContent, VaModal } from "vuestic-ui";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import shiftAPI from "@/services/shiftAPI";
import timeOffAPI from "@/services/timeOffAPI";
import logger from "@/utils/logger";

const schedules = ref([]);
const holidays = ref([]);
const reservations = ref([]);
const shifts = ref([]);
const timeOffs = ref([]);
const staffList = ref([]);
const showShifts = ref(true);
const loading = ref(true);
const showHolidayDialog = ref(false);
const newHoliday = ref({
  date: "",
  description: "",
  isClosed: true,
  openTime: "",
  closeTime: "",
  overrideType: "",
});

const OVERRIDE_TYPES = [
  { value: "", label: "Standard" },
  { value: "event", label: "Event" },
  { value: "private-party", label: "Private Party" },
  { value: "special", label: "Special Hours" },
];

const overrideLabel = (type) => {
  const found = OVERRIDE_TYPES.find((o) => o.value === type);
  return found ? found.label : type || "Standard";
};

const days = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 11;
  const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`;
  return { value: `${hour.toString().padStart(2, "0")}:00`, label };
});

const weeklyGrid = computed(() => {
  return days.map((day) => {
    const schedule = schedules.value.find((s) => s.dayOfWeek === day.value);
    const openHour = schedule?.openTime ? parseInt(schedule.openTime.split(":")[0], 10) : null;
    const closeHour = schedule?.closeTime ? parseInt(schedule.closeTime.split(":")[0], 10) : null;
    const isClosed = schedule?.isClosed ?? false;

    const hours = HOURS.map((h) => {
      const hour = parseInt(h.value.split(":")[0], 10);
      const isOpen = !isClosed && openHour !== null && closeHour !== null && hour >= openHour && hour < closeHour;
      const isTransition = hour === openHour || hour === closeHour;
      return { ...h, isOpen, isTransition };
    });

    return {
      day: day.value,
      label: day.label,
      hours,
      isClosed,
      openTime: schedule?.openTime,
      closeTime: schedule?.closeTime,
    };
  });
});

const dateOverrides = computed(() => {
  return holidays.value
    .filter((h) => h.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((h) => ({
      ...h,
      dateObj: new Date(h.date + "T00:00:00"),
    }));
});

const dayConflicts = computed(() => {
  const result = {};
  const byWeekday = {};
  (reservations.value || []).forEach((r) => {
    if (!r.resDate || !r.resTime) return;
    const d = new Date(r.resDate + "T00:00:00");
    const dow = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    (byWeekday[dow] = byWeekday[dow] || []).push(r);
  });
  schedules.value.forEach((s) => {
    if (s.isClosed) return;
    const openMin = s.openTime ? toMinutes(s.openTime) : null;
    const closeMin = s.closeTime ? toMinutes(s.closeTime) : null;
    if (openMin === null || closeMin === null) return;
    const conflicts = (byWeekday[s.dayOfWeek] || []).filter((r) => {
      const t = toMinutes(r.resTime);
      return t < openMin || t > closeMin;
    });
    if (conflicts.length) result[s.dayOfWeek] = conflicts.length;
  });
  return result;
});

const toMinutes = (time) => {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const shiftsByDay = computed(() => {
  const map = {};
  for (const s of shifts.value) {
    const list = map[s.dayOfWeek] || [];
    list.push({
      ...s,
      staffName: s.User?.username || "Staff",
      startMin: toMinutes(s.startTime),
      endMin: toMinutes(s.endTime),
    });
    map[s.dayOfWeek] = list;
  }
  return map;
});

const showShiftDialog = ref(false);
const newShift = ref({ userId: null, dayOfWeek: "monday", startTime: "11:00", endTime: "22:00", role: "" });

const openShiftDialog = async () => {
  showShiftDialog.value = true;
  newShift.value = { userId: null, dayOfWeek: "monday", startTime: "11:00", endTime: "22:00", role: "" };
  if (staffList.value.length === 0) {
    try {
      const res = await shiftAPI.getStaff();
      staffList.value = res?.data?.staff ?? [];
    } catch (err) {
      logger.error("Failed to load staff", { error: err.message });
    }
  }
};

const createShift = async () => {
  if (!newShift.value.userId) return;
  try {
    await shiftAPI.createShift({
      userId: newShift.value.userId,
      dayOfWeek: newShift.value.dayOfWeek,
      startTime: newShift.value.startTime + ":00",
      endTime: newShift.value.endTime + ":00",
      role: newShift.value.role || null,
    });
    showShiftDialog.value = false;
    await loadShifts();
  } catch (err) {
    logger.error("Failed to create shift", { error: err.message });
  }
};

const deleteShift = async (id) => {
  try {
    await shiftAPI.deleteShift(id);
    await loadShifts();
  } catch (err) {
    logger.error("Failed to delete shift", { error: err.message });
  }
};

const loadShifts = async () => {
  try {
    const res = await shiftAPI.getShifts();
    shifts.value = res?.data?.shifts ?? [];
  } catch (err) {
    logger.error("Failed to load shifts", { error: err.message });
  }
};

const loadTimeOffs = async () => {
  try {
    const res = await timeOffAPI.getTimeOffs();
    timeOffs.value = res?.data?.timeOffs ?? [];
  } catch (err) {
    logger.error("Failed to load time-offs", { error: err.message });
  }
};

const affectedDates = computed(() => {
  const set = new Set();
  for (const t of timeOffs.value) {
    if (t.status === "rejected") continue;
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      set.add(d.toISOString().slice(0, 10));
    }
  }
  return set;
});

const showTimeOffDialog = ref(false);
const newTimeOff = ref({ userId: null, startDate: "", endDate: "", reason: "" });

const openTimeOffDialog = async () => {
  showTimeOffDialog.value = true;
  newTimeOff.value = { userId: null, startDate: "", endDate: "", reason: "" };
  if (staffList.value.length === 0) {
    try {
      const res = await timeOffAPI.getStaff();
      staffList.value = res?.data?.staff ?? [];
    } catch (err) {
      logger.error("Failed to load staff", { error: err.message });
    }
  }
};

const createTimeOff = async () => {
  if (!newTimeOff.value.userId || !newTimeOff.value.startDate || !newTimeOff.value.endDate) return;
  try {
    await timeOffAPI.createTimeOff({
      userId: newTimeOff.value.userId,
      startDate: newTimeOff.value.startDate,
      endDate: newTimeOff.value.endDate,
      reason: newTimeOff.value.reason || null,
    });
    showTimeOffDialog.value = false;
    await loadTimeOffs();
  } catch (err) {
    logger.error("Failed to create time-off", { error: err.message });
  }
};

const setTimeOffStatus = async (id, status) => {
  try {
    await timeOffAPI.updateStatus(id, status);
    await loadTimeOffs();
  } catch (err) {
    logger.error("Failed to update time-off", { error: err.message });
  }
};

const removeTimeOff = async (id) => {
  try {
    await timeOffAPI.deleteTimeOff(id);
    await loadTimeOffs();
  } catch (err) {
    logger.error("Failed to delete time-off", { error: err.message });
  }
};

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
    const reservationsRes = await reservationAPI.getReservations();
    reservations.value = reservationsRes.data.collection || reservationsRes.data || [];
    await loadShifts();
    await loadTimeOffs();
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

const SCHEDULE_TEMPLATES = {
  weekday: { label: "Weekday (11–22)", openTime: "11:00:00", closeTime: "22:00:00", closed: ["sunday"] },
  weekend: { label: "Weekend (10–24)", openTime: "10:00:00", closeTime: "24:00:00", closed: [] },
  brunch: { label: "Brunch (09–21)", openTime: "09:00:00", closeTime: "21:00:00", closed: [] },
  holiday: { label: "Holiday (closed)", openTime: "11:00:00", closeTime: "22:00:00", closed: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
};

const customTemplates = ref(
  JSON.parse(localStorage.getItem("scheduleTemplates") || "[]")
);

const applyTemplate = async (key) => {
  const tpl = SCHEDULE_TEMPLATES[key];
  if (!tpl) return;
  for (const s of schedules.value) {
    s.openTime = tpl.openTime;
    s.closeTime = tpl.closeTime;
    s.isClosed = tpl.closed.includes(s.dayOfWeek);
    await updateSchedule(s);
  }
};

const saveCurrentAsTemplate = async () => {
  const name = prompt("Template name?");
  if (!name) return;
  const pattern = schedules.value.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    openTime: s.openTime,
    closeTime: s.closeTime,
    isClosed: s.isClosed,
  }));
  customTemplates.value = [...customTemplates.value, { name, pattern }];
  localStorage.setItem("scheduleTemplates", JSON.stringify(customTemplates.value));
};

const applyCustomTemplate = async (idx) => {
  const tpl = customTemplates.value[idx];
  if (!tpl) return;
  for (const p of tpl.pattern) {
    const s = schedules.value.find((x) => x.dayOfWeek === p.dayOfWeek);
    if (!s) continue;
    s.openTime = p.openTime;
    s.closeTime = p.closeTime;
    s.isClosed = p.isClosed;
    await updateSchedule(s);
  }
};

const deleteCustomTemplate = (idx) => {
  customTemplates.value = customTemplates.value.filter((_, i) => i !== idx);
  localStorage.setItem("scheduleTemplates", JSON.stringify(customTemplates.value));
};

const createHoliday = async () => {
  await scheduleAPI.createHoliday({
    date: newHoliday.value.date,
    description: newHoliday.value.description,
    isClosed: newHoliday.value.isClosed,
    openTime: newHoliday.value.isClosed ? null : newHoliday.value.openTime,
    closeTime: newHoliday.value.isClosed ? null : newHoliday.value.closeTime,
    overrideType: newHoliday.value.overrideType || null,
  });
  showHolidayDialog.value = false;
  newHoliday.value = {
    date: "",
    description: "",
    isClosed: true,
    openTime: "",
    closeTime: "",
    overrideType: "",
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
        <div class="section-card templates-card">
          <h2 class="section-title">Schedule Templates</h2>
          <div class="template-row">
            <button
              v-for="(tpl, key) in SCHEDULE_TEMPLATES"
              :key="key"
              class="template-btn"
              @click="applyTemplate(key)"
            >
              {{ tpl.label }}
            </button>
            <button class="template-btn save" @click="saveCurrentAsTemplate">💾 Save current</button>
          </div>
          <div v-if="customTemplates.length" class="custom-templates">
            <div
              v-for="(tpl, idx) in customTemplates"
              :key="idx"
              class="custom-template"
            >
              <button class="template-btn" @click="applyCustomTemplate(idx)">{{ tpl.name }}</button>
              <button class="template-del" @click="deleteCustomTemplate(idx)" title="Delete">×</button>
            </div>
          </div>
        </div>
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
                <span
                  v-if="dayConflicts[schedule.dayOfWeek]"
                  class="conflict-badge"
                  :title="dayConflicts[schedule.dayOfWeek] + ' reservation(s) fall outside open hours'"
                >
                  ⚠ {{ dayConflicts[schedule.dayOfWeek] }} conflict(s)
                </span>
                <VaSwitch
                  v-model="schedule.isClosed"
                  @change="updateSchedule(schedule)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section-card visual-calendar-card">
          <div class="visual-calendar-header-row">
            <h2 class="section-title">Visual Weekly Calendar</h2>
            <div class="visual-calendar-tools">
              <button class="btn btn-secondary" :class="{ active: showShifts }" @click="showShifts = !showShifts">
                👥 Shifts
              </button>
              <button class="btn btn-secondary" @click="openTimeOffDialog">
                🏖️ Time-off
              </button>
              <button class="btn btn-primary" @click="openShiftDialog">+ Add Shift</button>
            </div>
          </div>
          <div class="visual-calendar">
            <div class="calendar-header">
              <div class="time-gutter"></div>
              <div
                v-for="day in weeklyGrid"
                :key="day.day"
                class="day-header"
                :class="{ closed: day.isClosed }"
              >
                {{ day.label }}
                <span v-if="day.isClosed" class="closed-label">Closed</span>
                <div
                  v-if="showShifts && shiftsByDay[day.day]?.length"
                  class="day-shift-strip"
                >
                  <span
                    v-for="sh in shiftsByDay[day.day]"
                    :key="sh.id"
                    class="shift-pill"
                    :title="sh.staffName + ' ' + sh.startTime + '–' + sh.endTime"
                  >
                    {{ sh.staffName }}
                  </span>
                </div>
              </div>
            </div>
            <div class="calendar-body">
              <div
                v-for="hour in HOURS"
                :key="hour.value"
                class="calendar-row"
              >
                <div class="time-gutter">{{ hour.label }}</div>
                <div
                  v-for="day in weeklyGrid"
                  :key="day.day"
                  class="calendar-cell"
                  :class="{
                    open: day.hours.find((h) => h.value === hour.value)?.isOpen,
                    transition: day.hours.find((h) => h.value === hour.value)?.isTransition,
                    closed: day.isClosed,
                  }"
                >
                  <span v-if="day.hours.find((h) => h.value === hour.value)?.isTransition" class="transition-label">
                    {{ day.hours.find((h) => h.value === hour.value)?.isOpen ? 'Open' : 'Close' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showShifts && shifts.length" class="section-card shifts-card">
          <h2 class="section-title">Staff Shifts</h2>
          <div class="shifts-grid">
            <div v-for="day in weeklyGrid" :key="day.day" class="shift-day-col">
              <h3 class="shift-day-title">{{ day.label }}</h3>
              <p v-if="!shiftsByDay[day.day]?.length" class="shift-empty">No shifts</p>
              <ul v-else class="shift-list">
                <li v-for="sh in shiftsByDay[day.day]" :key="sh.id" class="shift-item">
                  <span class="shift-name">{{ sh.staffName }}</span>
                  <span class="shift-time">{{ sh.startTime }}–{{ sh.endTime }}</span>
                  <button class="shift-remove" @click="deleteShift(sh.id)" title="Remove">×</button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section-card timeoff-card">
          <div class="timeoff-header">
            <h2 class="section-title">Time-off Requests</h2>
            <button class="btn btn-primary" @click="openTimeOffDialog">+ Request</button>
          </div>
          <p v-if="!timeOffs.length" class="timeoff-empty">No time-off requests.</p>
          <ul v-else class="timeoff-list">
            <li v-for="t in timeOffs" :key="t.id" class="timeoff-item">
              <div class="timeoff-main">
                <span class="timeoff-staff">{{ t.User?.username || "Staff" }}</span>
                <span class="timeoff-range">{{ t.startDate }} → {{ t.endDate }}</span>
              </div>
              <span class="timeoff-status" :class="'st-' + t.status">{{ t.status }}</span>
              <div class="timeoff-actions">
                <button v-if="t.status === 'pending'" class="mini-btn approve" @click="setTimeOffStatus(t.id, 'approved')">✓</button>
                <button v-if="t.status === 'pending'" class="mini-btn reject" @click="setTimeOffStatus(t.id, 'rejected')">✕</button>
                <button class="mini-btn delete" @click="removeTimeOff(t.id)">🗑</button>
              </div>
            </li>
          </ul>
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
                <span
                  v-if="holiday.overrideType"
                  class="override-badge"
                  >{{ overrideLabel(holiday.overrideType) }}</span
                >
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
              <label class="field-label">Override Type</label>
              <select v-model="newHoliday.overrideType" class="field-input">
                <option
                  v-for="opt in OVERRIDE_TYPES"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
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

      <VaModal v-model="showShiftDialog" title="Add Staff Shift" size="small">
        <VaCard>
          <VaCardContent>
            <div class="field">
              <label class="field-label">Staff</label>
              <select v-model="newShift.userId" class="field-input">
                <option :value="null" disabled>Choose staff…</option>
                <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.username }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Day</label>
              <select v-model="newShift.dayOfWeek" class="field-input">
                <option v-for="d in days" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">Start</label>
                <input type="time" v-model="newShift.startTime" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">End</label>
                <input type="time" v-model="newShift.endTime" class="field-input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Role (optional)</label>
              <input type="text" v-model="newShift.role" placeholder="e.g. Host" class="field-input" />
            </div>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showShiftDialog = false">Cancel</VaButton>
            <VaButton preset="primary" :disabled="!newShift.userId" @click="createShift">Save</VaButton>
          </template>
        </VaCard>
      </VaModal>

      <VaModal v-model="showTimeOffDialog" title="Request Time Off" size="small">
        <VaCard>
          <VaCardContent>
            <div class="field">
              <label class="field-label">Staff</label>
              <select v-model="newTimeOff.userId" class="field-input">
                <option :value="null" disabled>Choose staff…</option>
                <option v-for="s in staffList" :key="s.id" :value="s.id">{{ s.username }}</option>
              </select>
            </div>
            <div class="field-row">
              <div class="field">
                <label class="field-label">From</label>
                <input type="date" v-model="newTimeOff.startDate" class="field-input" />
              </div>
              <div class="field">
                <label class="field-label">To</label>
                <input type="date" v-model="newTimeOff.endDate" class="field-input" />
              </div>
            </div>
            <div class="field">
              <label class="field-label">Reason (optional)</label>
              <input type="text" v-model="newTimeOff.reason" placeholder="Vacation, sick, etc." class="field-input" />
            </div>
          </VaCardContent>
          <template #actions>
            <VaButton preset="secondary" @click="showTimeOffDialog = false">Cancel</VaButton>
            <VaButton
              preset="primary"
              :disabled="!newTimeOff.userId || !newTimeOff.startDate || !newTimeOff.endDate"
              @click="createTimeOff"
            >Submit</VaButton>
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
  color: var(--accent-text);
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

.override-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent-text);
}

.conflict-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--rose-50);
  color: var(--rose-600);
  white-space: nowrap;
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

.visual-calendar {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.calendar-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 1;
}

.day-header {
  padding: var(--space-3) var(--space-2);
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
  border-left: 1px solid var(--border-subtle);
}

.day-header.closed {
  color: var(--rose-600);
  background: var(--rose-50);
}

.closed-label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.time-gutter {
  padding: var(--space-2);
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--ink-muted);
  text-align: center;
  border-left: 1px solid var(--border-subtle);
}

.calendar-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}

.calendar-row {
  display: contents;
}

.calendar-cell {
  height: 28px;
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface);
  position: relative;
  transition: background var(--duration-fast);
}

.calendar-cell.open {
  background: #dcfce7;
}

.calendar-cell.transition {
  background: #fef9c3;
}

.calendar-cell.closed {
  background: var(--rose-50);
}

.transition-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.visual-calendar-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.visual-calendar-tools {
  display: flex;
  gap: var(--space-2);
}
.day-shift-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
}
.shift-pill {
  font-size: 8px;
  font-weight: 600;
  background: var(--accent-soft, #dbeafe);
  color: var(--accent, #1d4ed8);
  border-radius: 6px;
  padding: 1px 4px;
  white-space: nowrap;
}
.shifts-card {
  margin-top: var(--space-6);
}
.shifts-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-3);
}
.shift-day-col {
  background: var(--neutral-50);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.shift-day-title {
  font-size: var(--text-sm);
  text-transform: capitalize;
  margin: 0 0 var(--space-2);
  color: var(--ink-secondary);
}
.shift-empty {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin: 0;
}
.shift-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.shift-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
}
.shift-name {
  font-weight: 600;
}
.shift-time {
  color: var(--ink-muted);
}
.shift-remove {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--rose-600, #e11d48);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}
.template-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.template-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--ink);
}
.template-btn.save {
  background: var(--accent-soft, #dbeafe);
}
.custom-templates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.custom-template {
  display: flex;
  align-items: center;
  gap: 2px;
}
.template-del {
  border: none;
  background: transparent;
  color: var(--rose-600, #e11d48);
  cursor: pointer;
  font-size: 1rem;
}

.field-row .field {
  flex: 1;
}

.timeoff-card {
  margin-top: var(--space-6);
}
.timeoff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.timeoff-empty {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.timeoff-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.timeoff-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.timeoff-main {
  display: flex;
  flex-direction: column;
}
.timeoff-staff {
  font-weight: 600;
}
.timeoff-range {
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.timeoff-status {
  font-size: var(--text-xs);
  text-transform: capitalize;
  padding: 2px 8px;
  border-radius: 999px;
}
.timeoff-status.st-pending {
  background: #fef9c3;
  color: #854d0e;
}
.timeoff-status.st-approved {
  background: #dcfce7;
  color: #15803d;
}
.timeoff-status.st-rejected {
  background: #fee2e2;
  color: #b91c1c;
}
.timeoff-actions {
  margin-left: auto;
  display: flex;
  gap: var(--space-2);
}
.mini-btn {
  border: 1px solid var(--border-subtle);
  background: var(--surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px 8px;
  font-size: var(--text-sm);
}
.mini-btn.approve {
  color: #15803d;
}
.mini-btn.reject {
  color: #b91c1c;
}
.mini-btn.delete {
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .shifts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}


@media (max-width: 768px) {
  .calendar-header,
  .calendar-body {
    grid-template-columns: 50px repeat(7, minmax(60px, 1fr));
  }
}
</style>

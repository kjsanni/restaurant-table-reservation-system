<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import dateNavigator from "@/utils/dateNavigator";
import { statusColor, shortName } from "@/utils/reservationDisplay";
import PageHeader from "@/components/PageHeader.vue";
import {
  paymentOptions,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from "@/constants";
import { useCalendarCore } from "@/composables/useCalendarCore";
import { useReservationActions } from "@/composables/useReservationActions";

const calendar = useCalendarCore();
const schedules = calendar.schedules;
const holidays = calendar.holidays;
const reservations = calendar.reservations;
const loading = calendar.loading;
const currentMonth = calendar.currentMonth;
const monthLabel = calendar.monthLabel;
const calendarDays = calendar.calendarDays;
const socket = calendar.socket;
const selectedDay = calendar.selectedDay;
const dayPopupOpen = calendar.dayPopupOpen;
const freeTables = calendar.freeTables;
const allTables = calendar.allTables;
const waitingStaffList = calendar.waitingStaffList;

const calendarView = ref("month");
const selectedDate = ref(new Date());
const typeFilter = ref("all");

const legendItems = [
  { label: "Pending", color: statusColor("pending") },
  { label: "Seated", color: statusColor("seated") },
  { label: "Completed", color: statusColor("completed") },
  { label: "Cancelled", color: statusColor("cancelled") },
  { label: "Missed", color: statusColor("missed") },
  { label: "Closed", color: "#ef4444" },
  { label: "Holiday", color: "var(--accent)" },
];

const typeFilterOptions = [
  { value: "all", label: "All" },
  { value: "reservations", label: "Reservations" },
  { value: "holidays", label: "Holidays" },
  { value: "closed", label: "Closed Days" },
];

const printCalendar = () => {
  window.print();
};

watch(typeFilter, () => {
  calendar.buildCalendarDaysFromCurrent();
});

const actions = useReservationActions({
  loadSchedule: calendar.loadSchedule,
  reservationAPI,
  tableAPI,
  groupAPI,
  loadFreeTables,
  loadWaitingStaff,
});

const activeAction = actions.activeAction;
const actionReservation = actions.actionReservation;
const actionLoading = actions.actionLoading;
const actionError = actions.actionError;
const newResDate = actions.newResDate;
const newResTime = actions.newResTime;
const actionTitle = actions.actionTitle;
const openAction = actions.openAction;
const closeAction = actions.closeAction;
const handleCancel = actions.handleCancel;
const handlePaymentChange = actions.handlePaymentChange;
const handleAssignTable = actions.handleAssignTable;
const handleAssignStaff = actions.handleAssignStaff;
const handleReschedule = actions.handleReschedule;

const MAX_VISIBLE = calendar.MAX_VISIBLE;

onMounted(async () => {
  await calendar.loadSchedule();
  calendar.connectSocket();
});

onUnmounted(() => {
  calendar.disconnectSocket();
});

const openDay = (day) => {
  calendar.openDay(day);
};

const closeDayPopup = () => {
  calendar.closeDayPopup();
};

const previousMonth = () => {
  calendar.previousMonth();
};

const nextMonth = () => {
  calendar.nextMonth();
};

const setView = (view) => {
  calendarView.value = view;
  if (view === "day") {
    selectedDate.value = new Date(currentMonth.value);
  }
};

const selectDate = (date) => {
  selectedDate.value = date;
  calendarView.value = "day";
};

const previousPeriod = () => {
  if (calendarView.value === "month") {
    previousMonth();
  } else if (calendarView.value === "week") {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() - 7);
    selectedDate.value = d;
  } else if (calendarView.value === "day") {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() - 1);
    selectedDate.value = d;
  }
};

const nextPeriod = () => {
  if (calendarView.value === "month") {
    nextMonth();
  } else if (calendarView.value === "week") {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 7);
    selectedDate.value = d;
  } else if (calendarView.value === "day") {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    selectedDate.value = d;
  }
};

const periodLabel = computed(() => {
  if (calendarView.value === "month") {
    return monthLabel.value;
  } else if (calendarView.value === "week") {
    const start = new Date(selectedDate.value);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("default", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else {
    return selectedDate.value.toLocaleDateString("default", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
});

const weekDays = computed(() => {
  const start = new Date(selectedDate.value);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
});

const dayReservations = computed(() => {
  if (calendarView.value !== "day") return [];
  const dateStr = dateNavigator.asDateString(selectedDate.value);
  return reservations.value
    .filter((r) => r.resDate === dateStr)
    .sort((a, b) => a.resTime.localeCompare(b.resTime));
});

const daySchedule = computed(() => {
  if (calendarView.value !== "day") return null;
  const dateStr = dateNavigator.asDateString(selectedDate.value);
  const dayOfWeek = selectedDate.value
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const schedule = schedules.value.find((s) => s.dayOfWeek === dayOfWeek);
  const holiday = holidays.value.find((h) => h.date === dateStr);
  return {
    isClosed: holiday?.isClosed || schedule?.isClosed || false,
    openTime: holiday?.openTime || schedule?.openTime,
    closeTime: holiday?.closeTime || schedule?.closeTime,
    holidayDesc: holiday?.description,
  };
});

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const getReservationsForDateAndHour = (date, hour) => {
  const dateStr = dateNavigator.asDateString(date);
  return reservations.value.filter((r) => {
    if (r.resDate !== dateStr) return false;
    const resHour = r.resTime?.slice(0, 2);
    return resHour === hour.slice(0, 2);
  });
};

const getReservationsForHour = (hour) => {
  return dayReservations.value.filter((r) => {
    const resHour = r.resTime?.slice(0, 2);
    return resHour === hour.slice(0, 2);
  });
};

const openNewReservationAt = (time) => {
  if (!daySchedule.value || daySchedule.value.isClosed) return;
  newResDate.value = dateNavigator.asDateString(selectedDate.value);
  newResTime.value = time + ":00";
  newResEndTime.value = "";
  actionReservation.value = null;
  activeAction.value = "new";
  actionLoading.value = false;
  actionError.value = "";
  freeTables.value = [];
  waitingStaffList.value = [];
  loadFreeTables();
  loadWaitingStaff();
};

const dragCreate = ref(false);
const createStart = ref(null);
const createEnd = ref(null);
const newResEndTime = ref("");

const onSlotDown = (hour) => {
  if (
    calendarView.value !== "day" ||
    (daySchedule.value && daySchedule.value.isClosed)
  )
    return;
  dragCreate.value = true;
  createStart.value = hour;
  createEnd.value = hour;
  window.addEventListener("mouseup", onSlotUp);
};

const onSlotEnter = (hour) => {
  if (!dragCreate.value) return;
  createEnd.value = hour;
};

const onSlotUp = () => {
  if (!dragCreate.value) return;
  dragCreate.value = false;
  window.removeEventListener("mouseup", onSlotUp);
  if (createStart.value == null) return;
  const startHour = Math.min(createStart.value, createEnd.value);
  const endHour = Math.max(createStart.value, createEnd.value);
  newResDate.value = dateNavigator.asDateString(selectedDate.value);
  newResTime.value = String(startHour).padStart(2, "0") + ":00";
  newResEndTime.value = String(endHour + 1).padStart(2, "0") + ":00";
  actionReservation.value = null;
  activeAction.value = "new";
  actionError.value = "";
  loadFreeTables();
  loadWaitingStaff();
};

const isSlotSelected = (hour) => {
  if (!dragCreate.value || createStart.value == null) return false;
  const lo = Math.min(createStart.value, createEnd.value);
  const hi = Math.max(createStart.value, createEnd.value);
  return hour >= lo && hour <= hi;
};

const createReservation = async () => {
  if (!newResDate.value || !newResTime.value) {
    actionError.value = "Please provide a date and start time";
    return;
  }
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.registerReservation({
      resDate: newResDate.value,
      resTime: newResTime.value,
      people: newPeople.value,
      name: newCustomerName.value || "Walk-in",
      expectedTotal: 0,
      paymentStatus: "unpaid",
    });
    await calendar.loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to create reservation");
  } finally {
    actionLoading.value = false;
  }
};

const newPeople = ref(2);
const newCustomerName = ref("");

const loadFreeTables = async () => {
  try {
    const res = await tableAPI.getTables();
    allTables.value = res.data.collection || [];
    freeTables.value = allTables.value.filter(
      (t) => !t.reservationId && !t.isBlocked
    );
  } catch {
    freeTables.value = [];
  }
};

const tableName = (res) => {
  if (!res) return null;
  if (res.tableName) return res.tableName;
  if (res.tableId) {
    const t = allTables.value.find((x) => x.id === res.tableId);
    return t ? t.name : null;
  }
  return null;
};

const reservationName = (res) => {
  return res?.Customer?.name || res?.name || "Walk-in";
};

const loadWaitingStaff = async () => {
  try {
    const groupRes = await groupAPI.getGroupByName("waiting_staff");
    waitingStaffList.value = groupRes.data.group.Users || [];
  } catch {
    waitingStaffList.value = [];
  }
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader
      title="Schedule Calendar"
      subtitle="View and manage reservations by date"
    />
    <div class="content-wrapper">
      <div class="calendar-header">
        <button @click="previousPeriod" class="nav-btn">
          <span class="nav-icon">‹</span>
        </button>
        <div class="header-center">
          <h2 class="month-label">{{ periodLabel }}</h2>
          <div class="view-toggle">
            <button
              v-for="view in ['month', 'week', 'day']"
              :key="view"
              class="toggle-btn"
              :class="{ active: calendarView === view }"
              @click="setView(view)"
            >
              {{ view.charAt(0).toUpperCase() + view.slice(1) }}
            </button>
          </div>
        </div>
        <button @click="nextPeriod" class="nav-btn">
          <span class="nav-icon">›</span>
        </button>
      </div>

      <div class="calendar-toolbar">
        <div class="legend-bar">
          <span
            v-for="item in legendItems"
            :key="item.label"
            class="legend-item"
          >
            <span
              class="legend-dot"
              :style="{ backgroundColor: item.color }"
            ></span>
            {{ item.label }}
          </span>
        </div>
        <div class="toolbar-actions">
          <div class="type-filter" v-if="calendarView === 'month'">
            <select v-model="typeFilter" class="filter-select">
              <option
                v-for="opt in typeFilterOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" @click="printCalendar">
            Print
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading calendar...</p>
      </div>

      <div v-else class="calendar-container">
        <div v-if="calendarView === 'month'" class="calendar-grid">
          <div
            v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="day"
            class="day-header"
          >
            {{ day }}
          </div>

          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="[
              'calendar-day',
              {
                closed: day.isClosed,
                holiday: day.isHoliday,
                'other-month': !day.isCurrentMonth,
                'has-reservations': (day.reservations?.length || 0) > 0,
                'dom-pending': day.dominantStatus === 'pending',
                'dom-confirmed': day.dominantStatus === 'confirmed',
                'dom-seated': day.dominantStatus === 'seated',
                'dom-completed': day.dominantStatus === 'completed',
                'dom-cancelled': day.dominantStatus === 'cancelled',
                'dom-missed': day.dominantStatus === 'missed',
              },
            ]"
            @click="openDay(day)"
          >
            <template v-if="day.date">
              <span class="day-number">{{ day.date }}</span>

              <div v-if="day.isClosed" class="day-badge closed-badge-closed">
                Closed
              </div>
              <div v-else-if="day.holidayDesc" class="day-badge holiday-badge">
                {{ day.holidayDesc }}
              </div>
              <div v-else-if="day.openTime" class="hours-badge">
                {{ day.openTime?.slice(0, 5) }} -
                {{ day.closeTime?.slice(0, 5) }}
              </div>

              <div class="reservation-chips">
                <div
                  v-for="res in day.visibleReservations"
                  :key="res.id"
                  class="res-chip"
                  :style="{
                    borderLeftColor: getPaymentStatusColor(res.paymentStatus),
                    borderLeftWidth: '3px',
                  }"
                >
                  <div class="res-top">
                    <span class="res-name">{{ shortName(res.name) }}</span>
                    <span
                      class="res-status-dot"
                      :style="{
                        backgroundColor: statusColor(res.resStatus),
                      }"
                    ></span>
                  </div>
                  <div class="res-meta">
                    <span class="res-time">{{ res.resTime?.slice(0, 5) }}</span>
                    <span class="res-people">{{ res.people }} ppl</span>
                  </div>
                </div>
                <div v-if="day.overflowCount > 0" class="res-overflow">
                  +{{ day.overflowCount }} more
                </div>
              </div>
            </template>
          </div>
        </div>

        <div v-else-if="calendarView === 'week'" class="week-view">
          <div class="week-grid">
            <div class="week-header">
              <div class="time-gutter"></div>
              <div
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="week-day-header"
              >
                <div class="week-day-name">
                  {{ day.toLocaleDateString("default", { weekday: "short" }) }}
                </div>
                <div class="week-day-date">{{ day.getDate() }}</div>
              </div>
            </div>
            <div class="week-body">
              <div
                v-for="slot in TIME_SLOTS"
                :key="slot.value"
                class="week-row"
              >
                <div class="time-gutter">{{ slot.label }}</div>
                <div
                  v-for="day in weekDays"
                  :key="day.toISOString()"
                  class="week-cell"
                  @click="selectDate(day)"
                >
                  <div
                    v-for="res in getReservationsForDateAndHour(
                      day,
                      slot.value
                    )"
                    :key="res.id"
                    class="week-reservation"
                    :style="{ borderLeftColor: statusColor(res.resStatus) }"
                  >
                    {{ shortName(res.name) }} {{ res.resTime?.slice(0, 5) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="calendarView === 'day'" class="day-view">
          <div class="day-header-bar">
            <h3 class="day-title">
              {{
                selectedDate.toLocaleDateString("default", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }}
            </h3>
            <span v-if="daySchedule?.isClosed" class="day-closed-badge"
              >Closed</span
            >
            <span v-else-if="daySchedule?.openTime" class="day-hours-badge">
              {{ daySchedule.openTime?.slice(0, 5) }} -
              {{ daySchedule.closeTime?.slice(0, 5) }}
            </span>
          </div>
          <p class="day-hint" v-if="!daySchedule?.isClosed">
            Click a time slot to add a reservation, or drag across slots to set
            a time range.
          </p>
          <div class="day-timeline">
            <div
              v-for="slot in TIME_SLOTS"
              :key="slot.value"
              class="time-slot"
              :class="{ 'slot-selected': isSlotSelected(parseInt(slot.value)) }"
              @click="openNewReservationAt(slot.value)"
              @mousedown="onSlotDown(parseInt(slot.value))"
              @mouseenter="onSlotEnter(parseInt(slot.value))"
            >
              <div class="slot-time">{{ slot.label }}</div>
              <div class="slot-content">
                <div
                  v-for="res in getReservationsForHour(slot.value)"
                  :key="res.id"
                  class="day-reservation"
                  :style="{
                    borderLeftColor: statusColor(res.resStatus),
                    backgroundColor:
                      getPaymentStatusColor(res.paymentStatus) + '20',
                  }"
                >
                  <div class="day-res-name">{{ shortName(res.name) }}</div>
                  <div class="day-res-meta">
                    {{ res.people }} ppl · {{ res.resTime?.slice(0, 5) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PopupBox
        :is-open="dayPopupOpen"
        :header-text="
          selectedDay ? 'Reservations — ' + selectedDay.dateStr : ''
        "
        :is-closable="true"
        @close-modal="closeDayPopup"
      >
        <template #popup-content>
          <div v-if="selectedDay" class="day-popup">
            <div v-if="selectedDay.isClosed" class="popup-state closed-state">
              <span class="state-icon">🔒</span>
              <p>Restaurant is closed this day.</p>
            </div>
            <div
              v-else-if="(selectedDay.reservations?.length || 0) === 0"
              class="popup-state empty-state"
            >
              <span class="state-icon">📅</span>
              <p>No reservations for this day.</p>
            </div>
            <div v-else>
              <div v-if="activeAction" class="action-panel">
                <div class="action-header">
                  <h3 class="action-title">{{ actionTitle }}</h3>
                  <button class="action-back" @click="closeAction">
                    ← Back
                  </button>
                </div>
                <div v-if="actionError" class="action-error">
                  {{ actionError }}
                </div>

                <div v-if="activeAction === 'cancel'" class="action-body">
                  <p class="action-text">
                    Cancel reservation for
                    <strong>{{ actionReservation.name || "Guest" }}</strong> on
                    {{ actionReservation.resTime?.slice(0, 5) }}?
                  </p>
                  <div class="action-buttons">
                    <button
                      class="btn btn-danger"
                      @click="handleCancel"
                      :disabled="actionLoading"
                    >
                      {{ actionLoading ? "Cancelling..." : "Yes, Cancel" }}
                    </button>
                  </div>
                </div>

                <div v-else-if="activeAction === 'payment'" class="action-body">
                  <p class="action-text">
                    Current:
                    <span
                      class="payment-status"
                      :style="{
                        color: getPaymentStatusColor(
                          actionReservation.paymentStatus || 'unpaid'
                        ),
                      }"
                      >{{ actionReservation.paymentStatus || "unpaid" }}</span
                    >
                  </p>
                  <div class="payment-options">
                    <button
                      v-for="opt in paymentOptions"
                      :key="opt.value"
                      :class="[
                        'pay-btn',
                        {
                          active:
                            (actionReservation.paymentStatus || 'unpaid') ===
                            opt.value,
                        },
                      ]"
                      :style="{
                        borderColor: getPaymentStatusColor(opt.value),
                        color:
                          (actionReservation.paymentStatus || 'unpaid') ===
                          opt.value
                            ? getPaymentStatusColor(opt.value)
                            : '',
                        backgroundColor:
                          (actionReservation.paymentStatus || 'unpaid') ===
                          opt.value
                            ? getPaymentStatusColor(opt.value) + '18'
                            : '',
                      }"
                      @click="handlePaymentChange(opt.value)"
                      :disabled="actionLoading"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>

                <div v-else-if="activeAction === 'table'" class="action-body">
                  <p class="action-text">Assign a free table:</p>
                  <div v-if="freeTables.length === 0" class="empty-msg">
                    No free tables available
                  </div>
                  <div class="table-grid">
                    <button
                      v-for="table in freeTables"
                      :key="table.id"
                      class="table-btn"
                      @click="handleAssignTable(table.id)"
                      :disabled="actionLoading"
                    >
                      Table {{ table.name || table.id }}
                    </button>
                  </div>
                </div>

                <div v-else-if="activeAction === 'staff'" class="action-body">
                  <p class="action-text">Assign waiting staff:</p>
                  <div v-if="waitingStaffList.length === 0" class="empty-msg">
                    No waiting staff available
                  </div>
                  <div class="staff-list-actions">
                    <button
                      v-for="staff in waitingStaffList"
                      :key="staff.id"
                      class="staff-btn"
                      @click="handleAssignStaff(staff.id)"
                      :disabled="actionLoading"
                    >
                      {{ staff.username }}
                    </button>
                  </div>
                </div>

                <div
                  v-else-if="activeAction === 'reschedule'"
                  class="action-body"
                >
                  <div class="field-group">
                    <label class="field-label">New Date</label>
                    <input
                      type="date"
                      v-model="newResDate"
                      class="action-input"
                    />
                  </div>
                  <div class="field-group">
                    <label class="field-label">New Time</label>
                    <input
                      type="time"
                      v-model="newResTime"
                      class="action-input"
                    />
                  </div>
                  <div class="action-buttons">
                    <button
                      class="btn btn-primary"
                      @click="handleReschedule"
                      :disabled="actionLoading"
                    >
                      {{ actionLoading ? "Saving..." : "Reschedule" }}
                    </button>
                  </div>
                </div>

                <div v-else-if="activeAction === 'new'" class="action-body">
                  <div class="field-group">
                    <label class="field-label">Date</label>
                    <input
                      type="date"
                      v-model="newResDate"
                      class="action-input"
                    />
                  </div>
                  <div class="field-group">
                    <label class="field-label">Start Time</label>
                    <input
                      type="time"
                      v-model="newResTime"
                      class="action-input"
                    />
                  </div>
                  <div class="field-group">
                    <label class="field-label">End Time</label>
                    <input
                      type="time"
                      v-model="newResEndTime"
                      class="action-input"
                    />
                  </div>
                  <div class="field-group">
                    <label class="field-label">Customer Name</label>
                    <input
                      type="text"
                      v-model="newCustomerName"
                      placeholder="Walk-in"
                      class="action-input"
                    />
                  </div>
                  <div class="field-group">
                    <label class="field-label">Party Size</label>
                    <input
                      type="number"
                      min="1"
                      v-model="newPeople"
                      class="action-input"
                    />
                  </div>
                  <div class="action-buttons">
                    <button
                      class="btn btn-primary"
                      @click="createReservation"
                      :disabled="actionLoading"
                    >
                      {{ actionLoading ? "Creating..." : "Create" }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="diagram-popup">
                <div class="popup-count">
                  {{ selectedDay.reservations.length }} reservation{{
                    selectedDay.reservations.length > 1 ? "s" : ""
                  }}
                </div>
                <div class="diagram-track">
                  <div class="diagram-line"></div>
                  <div
                    v-for="(res, idx) in selectedDay.reservations"
                    :key="res.id"
                    :class="['diagram-row', idx % 2 === 0 ? 'left' : 'right']"
                  >
                    <div class="diagram-node">
                      <span
                        class="diagram-dot"
                        :style="{
                          backgroundColor: statusColor(
                            res.resStatus || RESERVATION_STATUS.PENDING
                          ),
                        }"
                      ></span>
                    </div>
                    <div class="diagram-card">
                      <div class="timeline-card-header">
                        <span class="timeline-name">{{
                          reservationName(res)
                        }}</span>
                        <span
                          class="timeline-status"
                          :style="{
                            backgroundColor: statusColor(
                              res.resStatus || RESERVATION_STATUS.PENDING
                            ),
                          }"
                        >
                          {{ res.resStatus || "pending" }}
                        </span>
                      </div>
                      <div class="timeline-card-body">
                        <div class="timeline-row">
                          <span class="timeline-icon">🕐</span>
                          <span class="timeline-text">{{
                            res.resTime?.slice(0, 5)
                          }}</span>
                          <span class="timeline-spacer"></span>
                          <span class="timeline-icon">👥</span>
                          <span class="timeline-text"
                            >{{ res.people || "?" }} guests</span
                          >
                        </div>
                        <div class="timeline-row">
                          <span class="timeline-icon">💳</span>
                          <span
                            class="timeline-payment"
                            :style="{
                              color: getPaymentStatusColor(
                                res.paymentStatus || 'unpaid'
                              ),
                            }"
                          >
                            {{ res.paymentStatus || "unpaid" }}
                          </span>
                        </div>
                        <div v-if="res.email" class="timeline-row">
                          <span class="timeline-icon">✉️</span>
                          <span
                            class="timeline-text timeline-email"
                            :title="res.email"
                          >
                            {{ res.email }}
                          </span>
                        </div>
                        <div v-if="res.phone" class="timeline-row">
                          <span class="timeline-icon">📞</span>
                          <span class="timeline-text">{{ res.phone }}</span>
                        </div>
                        <div v-if="tableName(res)" class="timeline-row">
                          <span class="timeline-icon">🪑</span>
                          <span class="timeline-text"
                            >Table {{ tableName(res) }}</span
                          >
                        </div>
                        <div v-if="res.notes" class="timeline-row">
                          <span class="timeline-icon">📝</span>
                          <span class="timeline-text timeline-notes">{{
                            res.notes
                          }}</span>
                        </div>
                        <div class="diagram-actions">
                          <button
                            class="action-btn cancel"
                            @click.stop="openAction('cancel', res)"
                            title="Cancel"
                          >
                            ✕
                          </button>
                          <button
                            class="action-btn payment"
                            @click.stop="openAction('payment', res)"
                            title="Payment"
                          >
                            💳
                          </button>
                          <button
                            class="action-btn table"
                            @click.stop="openAction('table', res)"
                            title="Assign Table"
                          >
                            🪑
                          </button>
                          <button
                            class="action-btn staff"
                            @click.stop="openAction('staff', res)"
                            title="Assign Staff"
                          >
                            👤
                          </button>
                          <button
                            class="action-btn reschedule"
                            @click.stop="openAction('reschedule', res)"
                            title="Reschedule"
                          >
                            📅
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PopupBox>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}

.spinner {
  width: 32px;
  height: 32px;
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

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 0 4px;
}

.month-label {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  min-width: 220px;
  text-align: center;
  color: var(--ink);
  margin: 0;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 22px;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.nav-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}

.nav-icon {
  line-height: 1;
  margin-top: -2px;
}

.calendar-container {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-header {
  text-align: center;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px;
  background: var(--ink);
  color: var(--neutral-50);
  border-radius: 8px;
}

.calendar-day {
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  font-size: 10px;
  position: relative;
  background: var(--surface);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.calendar-day:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.day-number {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  text-align: right;
  line-height: 1;
  padding: 2px 4px;
}

.day-badge {
  font-size: 10px;
  text-align: center;
  padding: 3px 6px;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-weight: 500;
  margin: 2px 0;
}

.closed-badge-closed {
  color: var(--rose-600);
  background: var(--rose-50);
}

.holiday-badge {
  color: var(--accent-text);
  background: var(--accent-soft);
}

.hours-badge {
  font-size: 10px;
  text-align: center;
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 500;
  padding: 2px 4px;
  background: var(--neutral-100);
  border-radius: 4px;
  margin: 2px 0;
}

.reservation-chips {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}

.res-chip {
  background-color: var(--neutral-50);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 10px;
  border-left: 3px solid var(--ink-muted);
  transition: background-color 0.15s;
}

.res-chip:hover {
  background-color: var(--sky-50);
}

.res-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.res-name {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.res-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.res-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: var(--ink-muted);
  font-family: var(--font-sans);
}

.res-time {
  font-variant-numeric: tabular-nums;
}

.res-people {
  font-size: 9px;
}

.res-overflow {
  font-size: 10px;
  color: var(--accent);
  font-family: var(--font-sans);
  font-weight: 500;
  text-align: center;
  padding: 3px 0;
  cursor: pointer;
}

.res-overflow:hover {
  text-decoration: underline;
}

.closed {
  background-color: var(--rose-50);
  border-color: var(--rose-200);
}

.holiday {
  background-color: var(--accent-soft);
  border-color: var(--accent-200);
}

.other-month {
  opacity: 0.35;
  background-color: var(--neutral-50);
  min-height: 50px;
}

.has-reservations {
  border-color: var(--neutral-300);
}
.calendar-day.dom-pending {
  background: #fef9c3;
}
.calendar-day.dom-confirmed {
  background: #dbeafe;
}
.calendar-day.dom-seated {
  background: #dcfce7;
}
.calendar-day.dom-completed {
  background: #e0e7ff;
}
.calendar-day.dom-cancelled {
  background: #fee2e2;
}
.calendar-day.dom-missed {
  background: #ffedd5;
}

.day-popup {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.popup-count {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--ink);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.popup-state {
  text-align: center;
  padding: 30px 20px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.state-icon {
  font-size: 28px;
  opacity: 0.7;
}

.closed-state {
  color: var(--rose-600);
  font-family: var(--font-sans);
  font-weight: 500;
}

.empty-state {
  color: var(--ink-muted);
  font-family: var(--font-sans);
}

.diagram-popup {
  position: relative;
}

.diagram-track {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding-top: 12px;
  overflow: hidden;
}

.diagram-line {
  position: absolute;
  left: 50%;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--accent) 0%, var(--border) 100%);
  transform: translateX(-50%);
  opacity: 0.4;
  z-index: 0;
  pointer-events: none;
}

.diagram-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.diagram-row.left {
  justify-content: flex-start;
  padding-right: calc(50% + 18px);
}

.diagram-row.right {
  justify-content: flex-end;
  padding-left: calc(50% + 18px);
}

.diagram-node {
  position: absolute;
  left: 50%;
  top: 14px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.diagram-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--surface);
}

.diagram-card {
  width: 100%;
  background-color: var(--neutral-50);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.diagram-row.left .diagram-card {
  transform-origin: left center;
}

.diagram-row.right .diagram-card {
  transform-origin: right center;
}

.diagram-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.timeline-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.timeline-name {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.timeline-status {
  font-size: 10px;
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: capitalize;
  font-family: var(--font-sans);
  font-weight: 500;
  white-space: nowrap;
}

.timeline-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.timeline-icon {
  font-size: 13px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.timeline-text {
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: 12px;
}

.timeline-spacer {
  flex: 1;
}

.timeline-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.timeline-notes {
  font-style: italic;
  color: var(--text-muted);
}

.timeline-payment {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.action-panel {
  padding: 10px;
  background: var(--surface);
  border-radius: 10px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--ink);
}

.action-back {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
  font-family: var(--font-sans);
  font-weight: 500;
}

.action-error {
  background: var(--rose-50);
  color: var(--rose-600);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-family: var(--font-sans);
}

.action-body {
  padding: 10px 0;
}

.action-text {
  font-size: 14px;
  margin-bottom: 6px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-danger {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-danger:hover {
  background-color: var(--rose-100);
}

.btn-primary {
  background-color: var(--sky-600);
  color: white;
}

.btn-primary:hover {
  background-color: var(--sky-700);
}

.payment-status {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.payment-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.pay-btn {
  padding: 6px 14px;
  border: 2px solid;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-sans);
  font-weight: 500;
  transition: all 0.15s;
}

.pay-btn.active {
  background: var(--sky-600);
  color: white;
  border-color: var(--sky-600);
}

.empty-msg {
  color: var(--ink-muted);
  font-style: italic;
  padding: 10px 0;
  font-family: var(--font-sans);
}

.table-grid,
.staff-list-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.table-btn,
.staff-btn {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  transition: all 0.15s;
}

.table-btn:hover,
.staff-btn:hover {
  background: var(--neutral-50);
  border-color: var(--accent);
}

.field-group {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--ink);
  font-family: var(--font-sans);
}

.action-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  box-sizing: border-box;
}

.action-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: var(--neutral-100);
}

.action-btn.cancel {
  color: var(--rose-600);
}

.action-btn.payment {
  color: var(--sky-600);
}

.action-btn.table {
  color: var(--earth-600);
}

.action-btn.staff {
  color: #7c3aed;
}

.action-btn.reschedule {
  color: var(--accent-text);
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.view-toggle {
  display: flex;
  gap: var(--space-1);
  background: var(--neutral-100);
  padding: var(--space-1);
  border-radius: var(--radius-md);
}

.toggle-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-fast);
  text-transform: capitalize;
}

.toggle-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: 16px;
}

.legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.type-filter .filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  cursor: pointer;
}

@media print {
  .calendar-header,
  .calendar-toolbar,
  .nav-btn,
  .view-toggle,
  .toolbar-actions {
    display: none !important;
  }
  .content-wrapper {
    margin: 0 !important;
  }
  .calendar-container {
    box-shadow: none !important;
    border: none !important;
  }
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.week-view,
.day-view {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.week-grid,
.day-timeline {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}

.day-view .day-timeline {
  grid-template-columns: 60px 1fr;
}

.week-header,
.day-header-bar {
  display: contents;
}

.week-day-header {
  padding: var(--space-3) var(--space-2);
  text-align: center;
  background: var(--surface-sunken);
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.week-day-name {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.week-day-date {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
}

.week-body {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}

.week-row {
  display: contents;
}

.week-cell {
  height: 32px;
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface);
  cursor: pointer;
  transition: background var(--duration-fast);
  position: relative;
}

.week-cell:hover {
  background: var(--neutral-50);
}

.week-reservation {
  font-size: 11px;
  padding: 2px 6px;
  margin: 2px;
  border-left: 3px solid;
  border-radius: 4px;
  background: var(--surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.day-title {
  font-family: var(--font-sans);
  font-weight: 650;
  font-size: var(--text-base);
  color: var(--ink);
  margin: 0;
}

.day-hint {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  margin: 6px 0 0 0;
}

.day-closed-badge,
.day-hours-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
}

.day-closed-badge {
  background: var(--rose-50);
  color: var(--rose-600);
}

.day-hours-badge {
  background: var(--earth-50);
  color: var(--earth-600);
}

.time-slot {
  display: contents;
}

.slot-time {
  padding: var(--space-2);
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--ink-muted);
  text-align: center;
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
}

.slot-content {
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  min-height: 40px;
  padding: var(--space-1);
  background: var(--surface);
  cursor: pointer;
  transition: background var(--duration-fast);
}

.slot-content:hover {
  background: var(--neutral-50);
}

.slot-selected {
  background: var(--sky-50);
}

.slot-selected .slot-content {
  background: var(--sky-50);
  box-shadow: inset 0 0 0 2px var(--sky-400);
}

.day-reservation {
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-1);
  cursor: pointer;
  transition: transform var(--duration-fast);
}

.day-reservation:hover {
  transform: translateX(2px);
}

.day-res-name {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.day-res-meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
}

@media (max-width: 768px) {
  .week-grid,
  .week-body {
    grid-template-columns: 50px repeat(7, minmax(70px, 1fr));
  }

  .day-timeline {
    grid-template-columns: 50px 1fr;
  }
}
</style>

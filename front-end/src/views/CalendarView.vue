<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import PageHeader from "@/components/PageHeader.vue";
import {
  paymentOptions,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from "@/constants";

const schedules = ref([]);
const holidays = ref([]);
const reservations = ref([]);
const loading = ref(true);
const currentMonth = ref(new Date());
const monthLabel = ref("");
const calendarDays = ref([]);
const socket = ref(null);

const dayPopupOpen = ref(false);
const selectedDay = ref(null);

const activeAction = ref(null);
const actionReservation = ref(null);
const actionLoading = ref(false);
const actionError = ref("");

const freeTables = ref([]);
const waitingStaffList = ref([]);
const newResDate = ref("");
const newResTime = ref("");

const MAX_VISIBLE = 3;

onMounted(async () => {
  await loadSchedule();
  socket.value = io("", {
    path: "/socket.io",
  });
  socket.value.on("schedule-updated", () => loadSchedules());
  socket.value.on("holiday-updated", () => loadHolidays());
});

onUnmounted(() => {
  if (socket.value) socket.value.disconnect();
});

const loadSchedule = async () => {
  loading.value = true;
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  monthLabel.value = currentMonth.value.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const [schedulesRes, holidaysRes, reservationsRes] = await Promise.all([
    scheduleAPI.getSchedules(),
    scheduleAPI.getHolidays(),
    reservationAPI.getReservations(),
  ]);

  schedules.value = schedulesRes.data.schedules;
  holidays.value = holidaysRes.data.holidays;
  reservations.value = reservationsRes.data.collection;

  buildCalendarDays(year, month);
};

const loadSchedules = async () => {
  const res = await scheduleAPI.getSchedules();
  schedules.value = res.data.schedules;
  buildCalendarDaysFromCurrent();
};

const loadHolidays = async () => {
  const res = await scheduleAPI.getHolidays();
  holidays.value = res.data.holidays;
  buildCalendarDaysFromCurrent();
};

const loadReservations = async () => {
  const res = await reservationAPI.getReservations();
  reservations.value = res.data.collection;
  buildCalendarDaysFromCurrent();
};

const buildCalendarDaysFromCurrent = () => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  buildCalendarDays(year, month);
};

const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: null, isCurrentMonth: false });
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const schedule = schedules.value.find((s) => s.dayOfWeek === dayOfWeek);
    const holiday = holidays.value.find((h) => h.date === dateStr);
    const dayReservations = reservations.value
      .filter((r) => r.resDate === dateStr)
      .sort((a, b) => a.resTime.localeCompare(b.resTime));

    days.push({
      date: day,
      dateStr,
      isCurrentMonth: true,
      isClosed: holiday?.isClosed || schedule?.isClosed || false,
      isHoliday: !!holiday,
      holidayDesc: holiday?.description,
      openTime: holiday?.openTime || schedule?.openTime,
      closeTime: holiday?.closeTime || schedule?.closeTime,
      reservations: dayReservations,
      visibleReservations: dayReservations.slice(0, MAX_VISIBLE),
      overflowCount: Math.max(0, dayReservations.length - MAX_VISIBLE),
    });
  }

  calendarDays.value = days;
  loading.value = false;
};

const openDay = (day) => {
  selectedDay.value = day;
  dayPopupOpen.value = true;
};

const closeDayPopup = () => {
  dayPopupOpen.value = false;
  selectedDay.value = null;
};

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
  loadSchedule();
};

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
  loadSchedule();
};

const statusColor = (status) => {
  switch (status) {
    case "seated":
      return "#22c55e";
    case "cancelled":
      return "#ef4444";
    case "missed":
      return "#f59e0b";
    default:
      return "#3b82f6";
  }
};

const shortName = (name) => {
  if (!name) return "Guest";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + "." + parts[1][0] + ".";
  }
  return parts[0].slice(0, 8);
};

const actionTitle = computed(() => {
  const titles = {
    cancel: "Cancel Reservation",
    payment: "Update Payment",
    table: "Assign Table",
    staff: "Assign Staff",
    reschedule: "Reschedule",
  };
  return titles[activeAction.value] || "";
});

const openAction = (action, res) => {
  activeAction.value = action;
  actionReservation.value = res;
  actionError.value = "";
  if (action === "payment") {
    // no extra init needed
  } else if (action === "table") {
    loadFreeTables();
  } else if (action === "staff") {
    loadWaitingStaff();
  } else if (action === "reschedule") {
    newResDate.value = res.resDate || "";
    newResTime.value = res.resTime || "";
  }
};

const closeAction = () => {
  activeAction.value = null;
  actionReservation.value = null;
  actionError.value = "";
  freeTables.value = [];
  waitingStaffList.value = [];
  newResDate.value = "";
  newResTime.value = "";
};

const loadFreeTables = async () => {
  try {
    const res = await tableAPI.getTables();
    freeTables.value = res.data.collection.filter(
      (t) => !t.reservationId && !t.isBlocked
    );
  } catch {
    freeTables.value = [];
  }
};

const loadWaitingStaff = async () => {
  try {
    const groupRes = await groupAPI.getGroupByName("waiting_staff");
    waitingStaffList.value = groupRes.data.group.Users || [];
  } catch {
    waitingStaffList.value = [];
  }
};

const handleCancel = async () => {
  if (!actionReservation.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.cancelReservation(actionReservation.value.id);
    await loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to cancel reservation");
  } finally {
    actionLoading.value = false;
  }
};

const handlePaymentChange = async (status) => {
  if (!actionReservation.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.editReservation(actionReservation.value.id, {
      paymentStatus: status,
    });
    await loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to update payment");
  } finally {
    actionLoading.value = false;
  }
};

const handleAssignTable = async (tableId) => {
  if (!actionReservation.value || !tableId) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.chooseTable(actionReservation.value.id, tableId);
    await loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to assign table");
  } finally {
    actionLoading.value = false;
  }
};

const handleAssignStaff = async (userId) => {
  if (!actionReservation.value || !userId) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.assignStaff(actionReservation.value.id, userId);
    await loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to assign staff");
  } finally {
    actionLoading.value = false;
  }
};

const handleReschedule = async () => {
  if (!actionReservation.value) return;
  if (!newResDate.value || !newResTime.value) {
    actionError.value = "Please provide both date and time";
    return;
  }
  actionLoading.value = true;
  actionError.value = "";
  try {
    await reservationAPI.editReservation(actionReservation.value.id, {
      resDate: newResDate.value,
      resTime: newResTime.value,
    });
    await loadSchedule();
    closeAction();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to reschedule");
  } finally {
    actionLoading.value = false;
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
        <button @click="previousMonth" class="nav-btn">
          <span class="nav-icon">‹</span>
        </button>
        <h2 class="month-label">{{ monthLabel }}</h2>
        <button @click="nextMonth" class="nav-btn">
          <span class="nav-icon">›</span>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading calendar...</p>
      </div>

      <div v-else class="calendar-container">
        <div class="calendar-grid">
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
              <div
                v-if="activeAction && actionReservation"
                class="action-panel"
              >
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
                            res.resStatus || 'pending'
                          ),
                        }"
                      ></span>
                    </div>
                    <div class="diagram-card">
                      <div class="timeline-card-header">
                        <span class="timeline-name">{{
                          res.name || "Guest"
                        }}</span>
                        <span
                          class="timeline-status"
                          :style="{
                            backgroundColor: statusColor(
                              res.resStatus || 'pending'
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
</style>

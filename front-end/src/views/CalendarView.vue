<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import { paymentOptions, getPaymentStatusColor } from "@/constants";
import {
  VaAlert,
  VaButton,
  VaCard,
  VaCardContent,
  VaInput,
  VaModal,
} from "vuestic-ui";

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
  socket.value.on("schedule-updated", () => loadSchedule());
  socket.value.on("holiday-updated", () => loadSchedule());
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
  } catch (err) {
    logger.error("Failed to load free tables", { error: err.message });
    freeTables.value = [];
    actionError.value = "Failed to load available tables.";
  }
};

const loadWaitingStaff = async () => {
  try {
    const groupRes = await groupAPI.getGroupByName("waiting_staff");
    waitingStaffList.value = groupRes.data.group.Users || [];
  } catch (err) {
    logger.error("Failed to load waiting staff", { error: err.message });
    waitingStaffList.value = [];
    actionError.value = "Failed to load waiting staff.";
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
    <PageHeader title="..." />
    <div class="header">
      <h1>Schedule Calendar</h1>
    </div>
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

      <VaModal
        v-model="dayPopupOpen"
        :title="selectedDay ? 'Reservations — ' + selectedDay.dateStr : ''"
      >
        <VaCard>
          <VaCardContent>
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
                    <VaButton preset="secondary" @click="closeAction"
                      >← Back</VaButton
                    >
                  </div>
                  <VaAlert v-if="actionError" color="danger">{{
                    actionError
                  }}</VaAlert>

                  <div v-if="activeAction === 'cancel'" class="action-body">
                    <p class="action-text">
                      Cancel reservation for
                      <strong>{{ actionReservation.name || "Guest" }}</strong>
                      on {{ actionReservation.resTime?.slice(0, 5) }}?
                    </p>
                    <div class="action-buttons">
                      <VaButton
                        preset="danger"
                        @click="handleCancel"
                        :disabled="actionLoading"
                      >
                        {{ actionLoading ? "Cancelling..." : "Yes, Cancel" }}
                      </VaButton>
                    </div>
                  </div>

                  <div
                    v-else-if="activeAction === 'payment'"
                    class="action-body"
                  >
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
                      <VaButton
                        v-for="opt in paymentOptions"
                        :key="opt.value"
                        :color="
                          (actionReservation.paymentStatus || 'unpaid') ===
                          opt.value
                            ? 'primary'
                            : 'secondary'
                        "
                        @click="handlePaymentChange(opt.value)"
                        :disabled="actionLoading"
                      >
                        {{ opt.label }}
                      </VaButton>
                    </div>
                  </div>

                  <div v-else-if="activeAction === 'table'" class="action-body">
                    <p class="action-text">Assign a free table:</p>
                    <div v-if="freeTables.length === 0" class="empty-msg">
                      No free tables available
                    </div>
                    <div class="table-grid">
                      <VaButton
                        v-for="table in freeTables"
                        :key="table.id"
                        preset="secondary"
                        @click="handleAssignTable(table.id)"
                        :disabled="actionLoading"
                      >
                        Table {{ table.name || table.id }}
                      </VaButton>
                    </div>
                  </div>

                  <div v-else-if="activeAction === 'staff'" class="action-body">
                    <p class="action-text">Assign waiting staff:</p>
                    <div v-if="waitingStaffList.length === 0" class="empty-msg">
                      No waiting staff available
                    </div>
                    <div class="staff-list-actions">
                      <VaButton
                        v-for="staff in waitingStaffList"
                        :key="staff.id"
                        preset="secondary"
                        @click="handleAssignStaff(staff.id)"
                        :disabled="actionLoading"
                      >
                        {{ staff.username }}
                      </VaButton>
                    </div>
                  </div>

                  <div
                    v-else-if="activeAction === 'reschedule'"
                    class="action-body"
                  >
                    <div class="field-group">
                      <label class="field-label">New Date</label>
                      <VaInput type="date" v-model="newResDate" />
                    </div>
                    <div class="field-group">
                      <label class="field-label">New Time</label>
                      <VaInput type="time" v-model="newResTime" />
                    </div>
                    <div class="action-buttons">
                      <VaButton
                        preset="primary"
                        @click="handleReschedule"
                        :disabled="actionLoading"
                      >
                        {{ actionLoading ? "Saving..." : "Reschedule" }}
                      </VaButton>
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
                            <VaButton
                              icon="close"
                              preset="secondary"
                              @click.stop="openAction('cancel', res)"
                              title="Cancel"
                            />
                            <VaButton
                              icon="payment"
                              preset="secondary"
                              @click.stop="openAction('payment', res)"
                              title="Payment"
                            />
                            <VaButton
                              icon="table_restaurant"
                              preset="secondary"
                              @click.stop="openAction('table', res)"
                              title="Assign Table"
                            />
                            <VaButton
                              icon="person"
                              preset="secondary"
                              @click.stop="openAction('staff', res)"
                              title="Assign Staff"
                            />
                            <VaButton
                              icon="event"
                              preset="secondary"
                              @click.stop="openAction('reschedule', res)"
                              title="Reschedule"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VaCardContent>
        </VaCard>
      </VaModal>
    </div>
  </div>
</template>

<style scoped>
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--restaurant-charcoal);
  font-family: "Playfair Display", Georgia, serif;
}

.content-wrapper {
  margin-top: var(--page-margin-y);
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--restaurant-charcoal);
  font-family: "Playfair Display", Georgia, serif;
}

.content-wrapper {
  margin-top: 24px;
  margin-bottom: 24px;
  margin-left: var(--x-spacing-mobile);
  margin-right: var(--x-spacing-mobile);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  gap: 16px;
  color: var(--restaurant-warm-gray);
  font-family: "Lora", Georgia, serif;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--restaurant-stone);
  border-top-color: var(--restaurant-terracotta);
  border-radius: 50%;
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
  font-family: "Playfair Display", Georgia, serif;
  font-size: 18px;
  min-width: 220px;
  text-align: center;
  color: var(--restaurant-charcoal);
  margin: 0;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--restaurant-cream);
  border: 1px solid var(--restaurant-border);
  cursor: pointer;
  font-size: 22px;
  color: var(--restaurant-charcoal);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-btn:hover {
  background: var(--restaurant-terracotta);
  color: white;
  border-color: var(--restaurant-terracotta);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.nav-icon {
  line-height: 1;
  margin-top: -2px;
}

.calendar-container {
  background: var(--restaurant-cream);
  border: 1px solid var(--restaurant-border);
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
  font-family: "Playfair Display", Georgia, serif;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px;
  background: linear-gradient(
    135deg,
    var(--restaurant-charcoal) 0%,
    var(--restaurant-slate) 100%
  );
  color: var(--snow-white);
  border-radius: 8px;
}

.calendar-day {
  min-height: 80px;
  border: 1px solid var(--restaurant-border);
  border-radius: 8px;
  padding: 4px;
  font-size: 10px;
  position: relative;
  background: var(--restaurant-cream);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.calendar-day:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  border-color: var(--restaurant-terracotta);
  transform: translateY(-1px);
}

.day-number {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 13px;
  color: var(--restaurant-charcoal);
  text-align: right;
  line-height: 1;
  padding: 2px 4px;
}

.day-badge {
  font-size: 10px;
  text-align: center;
  padding: 3px 6px;
  border-radius: 6px;
  font-family: "Lora", Georgia, serif;
  margin: 2px 0;
}

.closed-badge-closed {
  color: var(--restaurant-terracotta);
  background: #fef2f2;
}

.holiday-badge {
  color: #92400e;
  background: #fffbeb;
}

.hours-badge {
  font-size: 10px;
  text-align: center;
  color: var(--restaurant-warm-gray);
  font-family: "Lora", Georgia, serif;
  padding: 2px 4px;
  background: #f3f4f6;
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
  background-color: #f8fafc;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 10px;
  border-left: 3px solid var(--secondary-gray);
  transition: background-color 0.15s;
}

.res-chip:hover {
  background-color: #eef2ff;
}

.res-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.res-name {
  font-family: "Lora", Georgia, serif;
  font-weight: 500;
  font-size: 10px;
  color: var(--restaurant-charcoal);
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
  color: var(--restaurant-warm-gray);
  font-family: "Lora", Georgia, serif;
}

.res-time {
  font-variant-numeric: tabular-nums;
}

.res-people {
  font-size: 9px;
}

.res-overflow {
  font-size: 10px;
  color: var(--restaurant-sky);
  font-family: "Lora", Georgia, serif;
  font-weight: 500;
  text-align: center;
  padding: 3px 0;
  cursor: pointer;
}

.res-overflow:hover {
  color: var(--restaurant-terracotta);
  text-decoration: underline;
}

.closed {
  background-color: #fff5f5;
  border-color: #fecaca;
}

.holiday {
  background-color: #fffbeb;
  border-color: #fde68a;
}

.other-month {
  opacity: 0.35;
  background-color: #f9fafb;
  min-height: 50px;
}

.has-reservations {
  border-color: #d1d5db;
}

.day-popup {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.popup-count {
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--restaurant-charcoal);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--restaurant-border);
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
  color: var(--restaurant-terracotta);
  font-family: "Lora", Georgia, serif;
  font-weight: 500;
}

.empty-state {
  color: var(--restaurant-warm-gray);
  font-family: "Lora", Georgia, serif;
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
  background: linear-gradient(
    180deg,
    var(--restaurant-terracotta) 0%,
    var(--restaurant-stone) 100%
  );
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
  box-shadow: 0 0 0 4px var(--primary-white);
}

.diagram-card {
  width: 100%;
  background-color: #f8fafc;
  border: 1px solid #f0f0f0;
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
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.timeline-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.timeline-name {
  font-family: "Inter-Bold";
  font-size: 13px;
  color: var(--primary-black);
}

.timeline-status {
  font-size: 10px;
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  text-transform: capitalize;
  font-family: "Inter-Medium";
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
  color: var(--secondary-gray);
  font-family: "Inter-Light";
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
  font-family: "Inter-Bold";
  font-size: 12px;
  text-transform: capitalize;
}

.action-panel {
  padding: 10px;
  background: var(--primary-white);
  border-radius: 10px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
}

.action-back {
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  font-size: 14px;
  font-family: "Inter-Medium";
}

.action-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-family: "Inter-Light";
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
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.15s;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-primary {
  background-color: var(--primary-blue);
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.payment-status {
  font-family: "Inter-Bold";
  font-size: 13px;
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
  font-family: "Inter-Medium";
  transition: all 0.15s;
}

.pay-btn.active {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.empty-msg {
  color: var(--secondary-gray);
  font-style: italic;
  padding: 10px 0;
  font-family: "Inter-Light";
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
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  transition: all 0.15s;
}

.table-btn:hover,
.staff-btn:hover {
  background: #f3f4f6;
  border-color: var(--primary-blue);
}

.field-group {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--primary-black);
  font-family: "Inter-Medium";
}

.action-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  box-sizing: border-box;
}

.action-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
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
  background: #f3f4f6;
}

.action-btn.cancel {
  color: #dc2626;
}

.action-btn.payment {
  color: var(--primary-blue);
}

.action-btn.table {
  color: #059669;
}

.action-btn.staff {
  color: #7c3aed;
}

.action-btn.reschedule {
  color: #d97706;
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 40px;
    margin-right: 40px;
  }
  .calendar-day {
    min-height: 90px;
  }
  .res-name {
    font-size: 11px;
  }
}
</style>

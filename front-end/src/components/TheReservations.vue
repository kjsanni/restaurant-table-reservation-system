<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import waitlistAPI from "@/services/waitlistAPI";
import PopupBox from "@/components/PopupBox.vue";
import ListContainer from "@/components/ListContainer.vue";
import ReservationInfo from "@/components/ReservationInfo.vue";
import ButtonAction from "@/components/ButtonAction.vue";
import GridContainer from "@/components/GridContainer.vue";
import RestaurantTable from "@/components/RestaurantTable.vue";
import EditReservation from "@/components/EditReservation.vue";
import ChooseTable from "@/components/ChooseTable.vue";
import AssignStaff from "@/components/AssignStaff.vue";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage } from "@/utils/apiError";
import SearchIcon from "~icons/ant-design/search-outlined";
import ClearIcon from "~icons/fluent/dismiss-16-filled";
import WaitlistIcon from "~icons/fluent/clock-16-regular";

const schedules = ref([]);
const holidays = ref([]);
const reservations = ref([]);
const loading = ref(true);
const currentMonth = ref(new Date());
const monthLabel = ref("");
const calendarDays = ref([]);
const socket = ref(null);

const searchVal = ref("");
const searchNotes = ref(true);

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
const tables = ref([]);
const isPopupOpen = ref(false);
const popupHeaderText = ref("");
const selectedReservation = ref(null);
const authStore = useAuthStore();
const canEditReservations = computed(
  () => authStore.user?.permissions?.edit_reservations === true
);
const canManageTables = computed(
  () => authStore.user?.permissions?.manage_tables === true
);

const canAddToWaitlist = computed(() => authStore.user?.role === "staff");

const showDeleteModal = ref(false);
const deleteTargetId = ref(null);

const showNoShowModal = ref(false);
const noShowTargetId = ref(null);

const openDeleteModal = (id) => {
  deleteTargetId.value = id;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTargetId.value = null;
};

const openNoShowModal = (id) => {
  noShowTargetId.value = id;
  showNoShowModal.value = true;
};

const closeNoShowModal = () => {
  showNoShowModal.value = false;
  noShowTargetId.value = null;
};

const confirmNoShow = async () => {
  if (!noShowTargetId.value) return;
  actionLoading.value = true;
  try {
    await reservationAPI.editReservation(noShowTargetId.value, {
      resStatus: "missed",
    });
    await loadSchedule();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to mark no-show");
  } finally {
    actionLoading.value = false;
    closeNoShowModal();
  }
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  actionLoading.value = true;
  try {
    await reservationAPI.cancelReservation(deleteTargetId.value);
    await loadSchedule();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to delete reservation");
  } finally {
    actionLoading.value = false;
    closeDeleteModal();
  }
};

const handleCancelItem = async (item) => {
  actionReservation.value = item;
  await handleCancel();
};

const unseatReservation = async (reservation) => {
  if (!reservation) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    const table = tables.value.find((t) => t.reservationId === reservation.id);
    if (!table) {
      actionError.value = "No table assigned to this reservation.";
      return;
    }
    await tableAPI.freeTable(table.id);
    await Promise.all([loadSchedule(), getTables()]);
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to unseat reservation");
  } finally {
    actionLoading.value = false;
  }
};

const sendToWaitlist = async (reservation) => {
  if (!reservation) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await waitlistAPI.addFromReservation(reservation.id);
    await loadSchedule();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to send to waitlist");
  } finally {
    actionLoading.value = false;
  }
};

const MAX_VISIBLE = 3;

onMounted(async () => {
  try {
    await loadSchedule();
  } catch {
    // schedule load failed, still try to load tables
  }
  try {
    await getTables();
  } catch {
    // tables load failed
  }
  socket.value = io("", {
    path: "/socket.io",
  });
  socket.value.on("schedule-updated", () => loadSchedules());
  socket.value.on("holiday-updated", () => loadHolidays());
  socket.value.on("table-freed", () => {
    loadReservations();
    getTables();
  });
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

  const scheduleMap = schedules.value.reduce(
    (m, s) => m.set(s.dayOfWeek, s),
    new Map()
  );
  const holidayMap = holidays.value.reduce(
    (m, h) => m.set(h.date, h),
    new Map()
  );

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const schedule = scheduleMap.get(dayOfWeek);
    const holiday = holidayMap.get(dateStr);
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

const paymentColor = (status) => {
  switch (status) {
    case "paid":
      return "#22c55e";
    case "partial":
      return "#f59e0b";
    case "deposit":
      return "#3b82f6";
    default:
      return "#9ca3af";
  }
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

const currDate = computed(() => {
  return currentMonth.value.toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });
});

const filterReservations = computed(() => {
  const dateStr = currentMonth.value.toISOString().split("T")[0];
  const prefix = dateStr.slice(0, 7);
  let filtered = reservations.value.filter(
    (r) => r.resDate && r.resDate.startsWith(prefix)
  );

  const query = searchVal.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((item) => {
      const searchableKeys = searchNotes.value
        ? Object.keys(item)
        : Object.keys(item).filter((key) => key !== "notes");

      return searchableKeys.some((key) => {
        const val = item[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }

  return filtered;
});

const clearSearch = () => {
  searchVal.value = "";
};

const openPopup = (headerText) => {
  isPopupOpen.value = true;
  popupHeaderText.value = headerText;
};

const assignSelectedReservation = (reservation) => {
  selectedReservation.value = reservation;
};

const refreshReservations = async () => {
  await loadSchedule();
};

const refreshTables = async () => {
  try {
    const res = await tableAPI.getTables();
    tables.value = res.data.collection;
  } catch {
    tables.value = [];
  }
};

const getTables = async () => {
  await refreshTables();
};

const getReservations = async () => {
  await loadReservations();
};

const prev = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
  loadSchedule();
};

const next = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
  loadSchedule();
};

const today = () => {
  currentMonth.value = new Date();
  loadSchedule();
};
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Reservations</h1>
      <div class="search-bar">
        <span class="search-icon"><SearchIcon /></span>
        <input
          type="search"
          class="search-input"
          placeholder="Search by name, phone, email, date..."
          v-model="searchVal"
        />
        <button
          v-if="searchVal"
          type="button"
          class="clear-btn"
          @click="clearSearch"
        >
          <ClearIcon />
        </button>
        <label class="notes-toggle">
          <input type="checkbox" v-model="searchNotes" />
          <span>Include notes</span>
        </label>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="date-controls">
        <button class="nav-btn" @click="prev()">
          <span class="nav-icon">‹</span>
        </button>
        <h2 class="date-label">Reservations for {{ currDate }}</h2>
        <button class="nav-btn" @click="next()">
          <span class="nav-icon">›</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="today()">Today</button>
      </div>

      <div class="sections-row">
        <div class="section-card reservations-card">
          <div class="card-header">
            <h2 class="section-title">Today's Reservations</h2>
          </div>
          <ListContainer
            :collection="reservations"
            :filteredCollection="filterReservations"
          >
            <template #card="slotProps">
              <div class="reservation-card">
                <ReservationInfo
                  :reservation="slotProps.item"
                  :can-delete="canEditReservations"
                  @on-delete="openDeleteModal"
                />
                <div class="card-meta">
                  <span class="status-badge" :class="slotProps.item.resStatus">
                    {{ slotProps.item.resStatus }}
                  </span>
                  <span
                    class="payment-badge"
                    :style="{
                      backgroundColor: paymentColor(
                        slotProps.item.paymentStatus
                      ),
                    }"
                  >
                    {{ slotProps.item.paymentStatus }}
                  </span>
                </div>
                <div
                  class="card-actions"
                  v-if="
                    ['pending', 'missed'].includes(slotProps.item.resStatus) ||
                    canManageTables
                  "
                >
                  <ButtonAction
                    v-if="
                      ['pending', 'missed'].includes(slotProps.item.resStatus)
                    "
                    text="Seat"
                    color="#22c55e"
                    @click="
                      openPopup('Choose Table');
                      assignSelectedReservation(slotProps.item);
                    "
                  />
                  <ButtonAction
                    text="Edit"
                    color="#3b82f6"
                    @click="
                      openPopup('Edit Reservation');
                      assignSelectedReservation(slotProps.item);
                    "
                  />
                  <ButtonAction
                    v-if="canManageTables"
                    text="Assign"
                    color="#f59e0b"
                    @click="
                      openPopup('Assign Staff');
                      assignSelectedReservation(slotProps.item);
                    "
                  />
                  <ButtonAction
                    v-if="
                      ['pending', 'missed'].includes(slotProps.item.resStatus)
                    "
                    text="Cancel"
                    color="#ef4444"
                    @click="handleCancelItem(slotProps.item)"
                  />
                  <ButtonAction
                    v-if="
                      slotProps.item.resStatus === 'pending' && canAddToWaitlist
                    "
                    text="Waitlist"
                    color="#f59e0b"
                    @click="sendToWaitlist(slotProps.item)"
                  >
                    <template #icon>
                      <WaitlistIcon />
                    </template>
                  </ButtonAction>
                  <ButtonAction
                    v-if="slotProps.item.resStatus === 'pending'"
                    text="Mark No-Show"
                    color="#f59e0b"
                    @click="openNoShowModal(slotProps.item.id)"
                  />
                  <ButtonAction
                    v-else-if="slotProps.item.resStatus === 'seated'"
                    text="Unseat"
                    color="#ef4444"
                    @click="unseatReservation(slotProps.item)"
                  />
                  <ButtonAction
                    v-else-if="canEditReservations"
                    text="Delete"
                    color="#ef4444"
                    @click="openDeleteModal(slotProps.item.id)"
                  />
                </div>
              </div>
            </template>
          </ListContainer>
        </div>

        <div class="section-card tables-card" ref="allTablesRef">
          <h2 class="section-title">All Tables</h2>
          <GridContainer :collection="tables">
            <template #card="slotProps">
              <RestaurantTable
                :table="slotProps.item"
                @on-freed-table="
                  getTables();
                  getReservations();
                "
              />
            </template>
          </GridContainer>
        </div>
      </div>
    </div>

    <PopupBox
      :is-open="isPopupOpen"
      :header-text="popupHeaderText"
      :is-closable="true"
      @close-modal="isPopupOpen = false"
    >
      <template #popup-content>
        <EditReservation
          v-if="popupHeaderText === 'Edit Reservation'"
          :reservation="selectedReservation"
          @on-edited="refreshReservations(true)"
        />
        <ChooseTable
          v-else-if="popupHeaderText === 'Choose Table'"
          :free-tables="freeTables"
          :reservation="selectedReservation"
          @on-chosen="
            refreshTables();
            getReservations();
          "
        />
        <AssignStaff
          v-else-if="popupHeaderText === 'Assign Staff'"
          :reservation="selectedReservation"
          @on-assigned="refreshReservations()"
          @on-unassigned="refreshReservations()"
        />
      </template>
    </PopupBox>

    <PopupBox
      :is-open="showDeleteModal"
      header-text="Confirm Delete"
      :is-closable="true"
      @close-modal="closeDeleteModal"
    >
      <template #popup-content>
        <div class="confirm-content">
          <p>Are you sure you want to permanently delete this reservation?</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="closeDeleteModal">
              Cancel
            </button>
            <button class="btn btn-danger" @click="confirmDelete">
              Delete
            </button>
          </div>
        </div>
      </template>
    </PopupBox>

    <PopupBox
      :is-open="showNoShowModal"
      header-text="Confirm No-Show"
      :is-closable="true"
      @close-modal="closeNoShowModal"
    >
      <template #popup-content>
        <div class="confirm-content">
          <p>Mark this reservation as a no-show?</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="closeNoShowModal">
              Cancel
            </button>
            <button class="btn btn-warning" @click="confirmNoShow">
              Mark No-Show
            </button>
          </div>
        </div>
      </template>
    </PopupBox>
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.date-label {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0;
  min-width: 240px;
  text-align: center;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 24px;
  color: var(--primary-black);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-btn:hover {
  background: var(--primary-blue);
  color: white;
  border-color: var(--primary-blue);
}

.nav-icon {
  line-height: 1;
  margin-top: -3px;
}

.sections-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--card-padding);
}

.section-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-header {
  margin-bottom: 16px;
}

.section-title {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
  margin: 0;
}

.table-wrapper {
  width: 100%;
  border-radius: 10px;
  overflow-x: auto;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: var(--x-spacing-desktop);
    margin-right: var(--x-spacing-desktop);
  }
  .sections-row {
    grid-template-columns: 1fr;
  }
}

.reservation-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-left: 15px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-family: "Inter-Medium";
  color: white;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: #3b82f6;
}

.status-badge.seated {
  background-color: #22c55e;
}

.status-badge.cancelled {
  background-color: #ef4444;
}

.status-badge.completed {
  background-color: #9ca3af;
}

.status-badge.missed {
  background-color: #f59e0b;
}

.payment-badge {
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-family: "Inter-Medium";
  text-transform: capitalize;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-left: 15px;
  padding-bottom: 8px;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-content p {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background-color: var(--primary-red);
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.search-bar {
  position: relative;
  max-width: 420px;
  width: 100%;
  margin-top: 12px;
  margin-left: var(--x-spacing-mobile);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-gray);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.search-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 42px 12px 44px;
  border: 1px solid #f0f0f0;
  border-radius: var(--input-radius);
  font-family: "Inter-Light";
  font-size: 15px;
  color: var(--primary-black);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-gray);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: var(--primary-black);
}

.clear-btn :deep(svg) {
  width: 18px;
  height: 18px;
}

.notes-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  margin-left: var(--x-spacing-mobile);
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--secondary-gray);
  cursor: pointer;
  user-select: none;
}

.notes-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-blue);
}

@media screen and (min-width: 1024px) {
  .search-bar {
    margin-left: var(--x-spacing-desktop);
  }
  .notes-toggle {
    margin-left: var(--x-spacing-desktop);
  }
}
</style>

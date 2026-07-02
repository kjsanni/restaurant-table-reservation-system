<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { VaButton, VaModal, VaCard, VaCardContent } from "vuestic-ui";
import { io } from "socket.io-client";
import scheduleAPI from "@/services/scheduleAPI";
import reservationAPI from "@/services/reservationAPI";
import tableAPI from "@/services/tableAPI";
import groupAPI from "@/services/groupAPI";
import ListContainer from "@/components/ListContainer.vue";
import ReservationInfo from "@/components/ReservationInfo.vue";
import GridContainer from "@/components/GridContainer.vue";
import RestaurantTable from "@/components/RestaurantTable.vue";
import EditReservation from "@/components/EditReservation.vue";
import ChooseTable from "@/components/ChooseTable.vue";
import AssignStaff from "@/components/AssignStaff.vue";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage } from "@/utils/apiError";

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
  return reservations.value.filter(
    (r) => r.resDate && r.resDate.startsWith(prefix)
  );
});

const openPopup = ({ headerText }) => {
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
                  <VaButton
                    v-if="
                      ['pending', 'missed'].includes(slotProps.item.resStatus)
                    "
                    preset="primary"
                    color="#22c55e"
                    @click="
                      openPopup('Choose Table');
                      assignSelectedReservation(slotProps.item);
                    "
                  >
                    Seat
                  </VaButton>
                  <VaButton
                    preset="primary"
                    color="#3b82f6"
                    @click="
                      openPopup('Edit Reservation');
                      assignSelectedReservation(slotProps.item);
                    "
                  >
                    Edit
                  </VaButton>
                  <VaButton
                    v-if="canManageTables"
                    preset="primary"
                    color="#f59e0b"
                    @click="
                      openPopup('Assign Staff');
                      assignSelectedReservation(slotProps.item);
                    "
                  >
                    Assign
                  </VaButton>
                  <VaButton
                    v-if="
                      ['pending', 'missed'].includes(slotProps.item.resStatus)
                    "
                    preset="danger"
                    @click="handleCancelItem(slotProps.item)"
                  >
                    Cancel
                  </VaButton>
                  <VaButton
                    v-if="slotProps.item.resStatus === 'pending'"
                    preset="warning"
                    @click="openNoShowModal(slotProps.item.id)"
                  >
                    Mark No-Show
                  </VaButton>
                  <VaButton
                    v-else-if="canEditReservations"
                    preset="danger"
                    @click="openDeleteModal(slotProps.item.id)"
                  >
                    Delete
                  </VaButton>
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

    <VaModal v-model="isPopupOpen" :title="popupHeaderText" size="large">
      <VaCard>
        <VaCardContent>
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
        </VaCardContent>
      </VaCard>
    </VaModal>

    <VaModal v-model="showDeleteModal" title="Confirm Delete" size="small">
      <VaCard>
        <VaCardContent>
          <p>Are you sure you want to permanently delete this reservation?</p>
        </VaCardContent>
        <template #actions>
          <VaButton preset="secondary" @click="closeDeleteModal"
            >Cancel</VaButton
          >
          <VaButton preset="danger" @click="confirmDelete">Delete</VaButton>
        </template>
      </VaCard>
    </VaModal>

    <VaModal v-model="showNoShowModal" title="Confirm No-Show" size="small">
      <VaCard>
        <VaCardContent>
          <p>Mark this reservation as a no-show?</p>
        </VaCardContent>
        <template #actions>
          <VaButton preset="secondary" @click="closeNoShowModal"
            >Cancel</VaButton
          >
          <VaButton preset="warning" @click="confirmNoShow"
            >Mark No-Show</VaButton
          >
        </template>
      </VaCard>
    </VaModal>
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
  font-family: "Lora", Georgia, serif;
  font-size: 14px;
  color: var(--restaurant-warm-gray);
  margin: 0;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.btn-danger {
  background: linear-gradient(
    135deg,
    var(--restaurant-terracotta) 0%,
    #b91c1c 100%
  );
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.btn-warning {
  background: linear-gradient(
    135deg,
    var(--restaurant-golden) 0%,
    #d97706 100%
  );
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-family: "Inter-Medium";
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-warning:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}
</style>

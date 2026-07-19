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
import { statusColor, shortName } from "@/utils/reservationDisplay";
import EditReservation from "@/components/EditReservation.vue";
import {
  ACTIVE_STATUSES,
  RESERVATION_STATUS,
} from "@/constants/reservationStatus";
import ChooseTable from "@/components/ChooseTable.vue";
import AssignStaff from "@/components/AssignStaff.vue";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage } from "@/utils/apiError";
import SearchIcon from "~icons/ant-design/search-outlined";
import ClearIcon from "~icons/fluent/dismiss-16-filled";
import WaitlistIcon from "~icons/fluent/clock-16-regular";
import dateNavigator from "@/utils/dateNavigator";
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
const waitingStaffList = calendar.waitingStaffList;

const searchVal = ref("");
const searchNotes = ref(true);
const statusFilter = ref("all");
const dateFrom = ref("");
const dateTo = ref("");
const paymentStatusFilter = ref("all");

const selectedIds = ref(new Set());
const bulkStatusTarget = ref("");
const bulkLoading = ref(false);
const bulkError = ref("");

const isSelected = (id) => selectedIds.value.has(id);
const toggleSelect = (id) => {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
};
const toggleSelectAll = () => {
  if (selectedIds.value.size === filterReservations.value.length) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(filterReservations.value.map((r) => r.id));
  }
};
const clearSelection = () => {
  selectedIds.value = new Set();
  bulkStatusTarget.value = "";
  bulkError.value = "";
};

const bulkCancel = async () => {
  if (selectedIds.value.size === 0) return;
  bulkLoading.value = true;
  bulkError.value = "";
  try {
    await reservationAPI.bulkCancel(Array.from(selectedIds.value));
    await calendar.loadSchedule();
    clearSelection();
  } catch (err) {
    bulkError.value = getApiErrorMessage(err, "Failed to cancel reservations");
  } finally {
    bulkLoading.value = false;
  }
};

const bulkUpdateStatus = async () => {
  if (selectedIds.value.size === 0 || !bulkStatusTarget.value) return;
  bulkLoading.value = true;
  bulkError.value = "";
  try {
    await reservationAPI.bulkUpdate(Array.from(selectedIds.value), {
      resStatus: bulkStatusTarget.value,
    });
    await calendar.loadSchedule();
    clearSelection();
  } catch (err) {
    bulkError.value = getApiErrorMessage(err, "Failed to update reservations");
  } finally {
    bulkLoading.value = false;
  }
};

const exportCSV = () => {
  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "resDate",
    "resTime",
    "people",
    "resStatus",
    "paymentStatus",
    "notes",
  ];
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = filterReservations.value.map((r) =>
    headers.map((h) => escape(r[h])).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "reservations.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const duplicateReservation = async (reservation) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const resDate = dateNavigator.asDateString(tomorrow);
  bulkLoading.value = true;
  bulkError.value = "";
  try {
    await reservationAPI.registerReservation({
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      resDate,
      resTime: reservation.resTime,
      people: reservation.people,
      expectedTotal: reservation.expectedTotal || 0,
      paymentStatus: "unpaid",
      notes: reservation.notes,
    });
    await calendar.loadSchedule();
  } catch (err) {
    bulkError.value = getApiErrorMessage(
      err,
      "Failed to duplicate reservation"
    );
  } finally {
    bulkLoading.value = false;
  }
};

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

const canAddToWaitlist = computed(
  () => authStore.user?.role === "admin" || authStore.user?.role === "staff"
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
    await calendar.loadSchedule();
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
    await calendar.loadSchedule();
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
    await Promise.all([calendar.loadSchedule(), getTables()]);
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
    await calendar.loadSchedule();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to send to waitlist");
  } finally {
    actionLoading.value = false;
  }
};

const MAX_VISIBLE = calendar.MAX_VISIBLE;

onMounted(async () => {
  try {
    await calendar.loadSchedule();
  } catch {
    // schedule load failed, still try to load tables
  }
  try {
    await getTables();
  } catch {
    // tables load failed
  }
  calendar.connectSocket();
});

onUnmounted(() => {
  calendar.disconnectSocket();
});

const paymentColor = (status) => {
  switch (status) {
    case "paid":
      return "#4d7c0f";
    case "partial":
      return "#d97706";
    case "deposit":
      return "#3b82f6";
    default:
      return "#9a9389";
  }
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
const handleCancel = actions.handleCancel;

const currDate = computed(() => {
  return currentMonth.value.toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  });
});

const filterReservations = computed(() => {
  const dateStr = dateNavigator.asDateString(currentMonth.value);
  const prefix = dateStr.slice(0, 7);
  let filtered = reservations.value.filter(
    (r) => r.resDate && r.resDate.startsWith(prefix)
  );

  if (statusFilter.value !== "all") {
    filtered = filtered.filter((r) => r.resStatus === statusFilter.value);
  }

  if (paymentStatusFilter.value !== "all") {
    filtered = filtered.filter(
      (r) => r.paymentStatus === paymentStatusFilter.value
    );
  }

  if (dateFrom.value) {
    filtered = filtered.filter((r) => r.resDate && r.resDate >= dateFrom.value);
  }
  if (dateTo.value) {
    filtered = filtered.filter((r) => r.resDate && r.resDate <= dateTo.value);
  }

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

const clearFilters = () => {
  statusFilter.value = "all";
  dateFrom.value = "";
  dateTo.value = "";
  paymentStatusFilter.value = "all";
  searchVal.value = "";
  searchNotes.value = true;
};

const filteredCount = computed(() => filterReservations.value.length);
const totalCount = computed(() => reservations.value.length);

const todayCount = computed(() => {
  const todayStr = dateNavigator.asDateString(new Date());
  return reservations.value.filter((r) => r.resDate === todayStr).length;
});

const statusCounts = computed(() => {
  const counts = {};
  reservations.value.forEach((r) => {
    if (
      r.resDate &&
      r.resDate.startsWith(
        dateNavigator.asDateString(currentMonth.value).slice(0, 7)
      )
    ) {
      counts[r.resStatus] = (counts[r.resStatus] || 0) + 1;
    }
  });
  return counts;
});

const paymentCounts = computed(() => {
  const counts = {};
  reservations.value.forEach((r) => {
    if (
      r.resDate &&
      r.resDate.startsWith(currentMonth.value.toISOString().slice(0, 7))
    ) {
      counts[r.paymentStatus] = (counts[r.paymentStatus] || 0) + 1;
    }
  });
  return counts;
});

const openPopup = (headerText) => {
  isPopupOpen.value = true;
  popupHeaderText.value = headerText;
};

const assignSelectedReservation = (reservation) => {
  selectedReservation.value = reservation;
};

const refreshReservations = async () => {
  await calendar.loadSchedule();
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
  await calendar.loadReservations();
};

const prev = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  );
  calendar.loadSchedule();
};

const next = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  );
  calendar.loadSchedule();
};

const today = () => {
  currentMonth.value = new Date();
  calendar.loadSchedule();
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
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <div class="status-chips">
            <button
              v-for="status in Object.values(RESERVATION_STATUS)"
              :key="status"
              class="chip"
              :class="[
                statusFilter === status ? 'active' : '',
                statusFilter === status ? status : '',
              ]"
              @click="statusFilter = statusFilter === status ? 'all' : status"
            >
              {{ status }}
              <span class="chip-count">{{ statusCounts[status] || 0 }}</span>
            </button>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Date Range</label>
          <div class="date-range-inputs">
            <input
              v-model="dateFrom"
              type="date"
              class="filter-input"
              placeholder="From"
            />
            <span class="date-separator">to</span>
            <input
              v-model="dateTo"
              type="date"
              class="filter-input"
              placeholder="To"
            />
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Payment</label>
          <select v-model="paymentStatusFilter" class="filter-select">
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="deposit">Deposit</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="clear-filters-btn" @click="clearFilters">
            Clear Filters
          </button>
        </div>
      </div>

      <table class="bulk-select-all" v-if="filteredCount > 0">
        <tbody>
          <tr>
            <td class="select-col">
              <input
                type="checkbox"
                :checked="
                  selectedIds.size === filterReservations.length &&
                  filterReservations.length > 0
                "
                @change="toggleSelectAll"
                aria-label="Select all reservations"
              />
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="stats-bar">
        <span class="stats-text">
          Showing {{ filteredCount }} of {{ totalCount }} reservations
        </span>
        <span class="stats-today" v-if="todayCount > 0">
          · {{ todayCount }} today
        </span>
        <button class="btn btn-secondary btn-sm" @click="exportCSV">
          Export CSV
        </button>
      </div>

      <div class="bulk-bar" v-if="selectedIds.size > 0">
        <span class="bulk-count">{{ selectedIds.size }} selected</span>
        <select v-model="bulkStatusTarget" class="filter-select bulk-select">
          <option value="">Change status…</option>
          <option
            v-for="status in Object.values(RESERVATION_STATUS)"
            :key="status"
            :value="status"
          >
            {{ status }}
          </option>
        </select>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!bulkStatusTarget || bulkLoading"
          @click="bulkUpdateStatus"
        >
          Apply
        </button>
        <button
          class="btn btn-danger btn-sm"
          :disabled="bulkLoading"
          @click="bulkCancel"
        >
          Cancel Selected
        </button>
        <button class="btn btn-secondary btn-sm" @click="clearSelection">
          Clear
        </button>
        <span class="bulk-error" v-if="bulkError">{{ bulkError }}</span>
      </div>

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
                <div class="card-select-row">
                  <input
                    type="checkbox"
                    :checked="isSelected(slotProps.item.id)"
                    @change="toggleSelect(slotProps.item.id)"
                    aria-label="Select reservation"
                  />
                </div>
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
                    ACTIVE_STATUSES.includes(slotProps.item.resStatus) ||
                    canManageTables
                  "
                >
                  <ButtonAction
                    v-if="
                      ['pending', 'missed', 'completed'].includes(
                        slotProps.item.resStatus
                      )
                    "
                    text="Seat"
                    color="#4d7c0f"
                    @click="
                      openPopup('Choose Table');
                      assignSelectedReservation(slotProps.item);
                      loadFreeTables();
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
                    color="#d97706"
                    @click="
                      openPopup('Assign Staff');
                      assignSelectedReservation(slotProps.item);
                    "
                  />
                  <ButtonAction
                    v-if="ACTIVE_STATUSES.includes(slotProps.item.resStatus)"
                    text="Cancel"
                    color="#f43f5e"
                    @click="handleCancelItem(slotProps.item)"
                  />
                  <ButtonAction
                    v-if="
                      slotProps.item.resStatus === RESERVATION_STATUS.PENDING &&
                      canAddToWaitlist
                    "
                    text="Waitlist"
                    color="#d97706"
                    @click="sendToWaitlist(slotProps.item)"
                  >
                    <template #icon>
                      <WaitlistIcon />
                    </template>
                  </ButtonAction>
                  <ButtonAction
                    v-if="
                      slotProps.item.resStatus === RESERVATION_STATUS.PENDING
                    "
                    text="Mark No-Show"
                    color="#d97706"
                    @click="openNoShowModal(slotProps.item.id)"
                  />
                  <ButtonAction
                    v-else-if="
                      slotProps.item.resStatus === RESERVATION_STATUS.SEATED
                    "
                    text="Unseat"
                    color="#f43f5e"
                    @click="unseatReservation(slotProps.item)"
                  />
                  <ButtonAction
                    v-if="canEditReservations"
                    text="Delete"
                    color="#f43f5e"
                    @click="openDeleteModal(slotProps.item.id)"
                  />
                  <ButtonAction
                    v-if="canEditReservations"
                    text="Duplicate"
                    color="#6b4a3a"
                    @click="duplicateReservation(slotProps.item)"
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
  height: 64px;
  background: var(--border) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--space-6);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--neutral-50);
  text-shadow: 1px 1px 2px var(--ink);
}

.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
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
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--ink);
  margin: 0;
  min-width: 240px;
  text-align: center;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 24px;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.nav-btn:hover {
  background: var(--sky-600);
  color: white;
  border-color: var(--sky-600);
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
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-header {
  margin-bottom: 16px;
}

.section-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--ink);
  margin: 0;
  letter-spacing: var(--tracking-tight);
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
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.btn-primary {
  background: linear-gradient(135deg, var(--sky-600) 0%, var(--sky-500) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--sky-700) 0%, var(--sky-600) 100%);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--text-xs);
}

.filters-bar {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-sunken);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 180px;
}

.filter-label {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-muted);
}

.status-chips {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.chip {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast);
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.chip.active {
  color: white;
  border-color: transparent;
}

.chip.active.pending {
  background-color: var(--sky-500);
}
.chip.active.seated {
  background-color: var(--earth-500);
}
.chip.active.cancelled {
  background-color: var(--rose-500);
}
.chip.active.completed {
  background-color: var(--success);
}
.chip.active.missed {
  background-color: var(--neutral-500);
}

.chip-count {
  font-size: 10px;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 1px 6px;
}

.chip.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.filter-input,
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
}

.filter-input {
  flex: 1;
  min-width: 0;
}

.filter-select {
  width: 100%;
  cursor: pointer;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
}

.date-separator {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.clear-filters-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast);
  white-space: nowrap;
  height: 38px;
}

.clear-filters-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.stats-bar {
  padding: var(--space-2) var(--space-4);
  background: var(--accent-soft);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.stats-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--accent-text);
  font-weight: 500;
}

.stats-today {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-muted);
  font-weight: 600;
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.bulk-count {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}

.bulk-select {
  width: auto;
  min-width: 140px;
}

.bulk-error {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--rose-600);
}

.card-select-row {
  display: flex;
  justify-content: flex-end;
}

.card-select-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent);
}

.bulk-select-all {
  margin-left: auto;
}

.bulk-select-all .select-col {
  padding: 0;
}

.bulk-select-all input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent);
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--space-8);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
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
  font-family: var(--font-sans);
  font-weight: 500;
  color: white;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: var(--sky-500);
}

.status-badge.seated {
  background-color: var(--earth-500);
}

.status-badge.cancelled {
  background-color: var(--rose-500);
}

.status-badge.completed {
  background-color: var(--neutral-500);
}

.status-badge.missed {
  background-color: var(--accent-500);
}

.payment-badge {
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-family: var(--font-sans);
  font-weight: 500;
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
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-danger:hover {
  background-color: var(--rose-100);
}

.btn-warning {
  background-color: var(--accent-soft);
  color: var(--accent-text);
}

.btn-warning:hover {
  background-color: var(--accent-100);
}

.search-bar {
  position: relative;
  max-width: 420px;
  width: 100%;
  margin-top: 12px;
  margin-left: var(--space-6);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-muted);
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
  border: 1px solid var(--border);
  border-radius: var(--input-radius);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--duration-200) var(--ease-in-out),
    box-shadow var(--duration-200) var(--ease-in-out);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: var(--neutral-100);
  color: var(--ink);
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
  margin-left: var(--space-6);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink-muted);
  cursor: pointer;
  user-select: none;
}

.notes-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--accent);
}

@media screen and (min-width: 1024px) {
  .search-bar {
    margin-left: var(--space-8);
  }
  .notes-toggle {
    margin-left: var(--space-8);
  }
}
</style>

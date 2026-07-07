<script setup>
import { ref, computed, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import TableView from "@/components/TableView.vue";
import PopupBox from "@/components/PopupBox.vue";
import EditReservation from "@/components/EditReservation.vue";
import logger from "@/utils/logger";

const loading = ref(true);
const reservations = ref([]);
const summary = ref({
  deposit: 0,
  partial: 0,
  paid: 0,
  unpaid: 0,
});

const paymentStatusOrder = ["unpaid", "deposit", "partial", "paid"];

const paymentDisplayLabels = {
  unpaid: "Unpaid",
  deposit: "Deposit",
  partial: "Partial Payment",
  paid: "Full Payment",
};

const paymentBarColors = {
  unpaid: "#9ca3af",
  deposit: "#3b82f6",
  partial: "#f59e0b",
  paid: "#22c55e",
};

const filterPaymentStatus = ref(null);
const filterResStatus = ref(null);
const sortField = ref("id");
const sortDirection = ref("desc");

const filteredReservations = computed(() => {
  let data = [...reservations.value];
  if (filterPaymentStatus.value) {
    data = data.filter((r) => r.paymentStatus === filterPaymentStatus.value);
  }
  if (filterResStatus.value) {
    data = data.filter((r) => r.resStatus === filterResStatus.value);
  }
  data.sort((a, b) => {
    const aVal = a[sortField.value] ?? "";
    const bVal = b[sortField.value] ?? "";
    if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });
  return data;
});

const totalReservations = computed(() => {
  return Object.values(summary.value).reduce((sum, count) => sum + count, 0);
});

const maxCount = computed(() => {
  return Math.max(...Object.values(summary.value), 1);
});

const barWidth = (status) => {
  return `${(summary.value[status] / maxCount.value) * 100}%`;
};

const tableFields = {
  id: "ID",
  name: "Customer",
  resDate: "Date",
  resTime: "Time",
  people: "People",
  resStatus: "Status",
  paymentStatus: "Payment",
};

const isPopupOpen = ref(false);
const popupHeaderText = ref("");
const selectedReservation = ref(null);

const openPopup = ({ headerText }) => {
  isPopupOpen.value = true;
  popupHeaderText.value = headerText;
};

const closePopup = () => {
  isPopupOpen.value = false;
  popupHeaderText.value = "";
  selectedReservation.value = null;
};

const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false;
  deleteTargetId.value = null;
};

const refreshData = async () => {
  await loadData();
  closePopup();
};

const loadData = async () => {
  loading.value = true;
  try {
    const [resRes, summaryRes] = await Promise.all([
      reservationAPI.getReservations(),
      reservationAPI.getPaymentSummary(),
    ]);
    reservations.value = resRes.data.collection;
    summary.value = summaryRes.data.summary;
  } catch (err) {
    logger.error("Failed to load payment dashboard", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);

const handleSelectedReservation = async (item) => {
  if (!item?.id) return;
  const action = item.action;
  if (action === "edit") {
    openPopup({ headerText: "Edit Reservation" });
    selectedReservation.value = item;
  } else if (action === "delete") {
    deleteTargetId.value = item.id;
    showDeleteConfirm.value = true;
  }
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  try {
    await reservationAPI.cancelReservation(deleteTargetId.value);
    await loadData();
  } catch (err) {
    logger.error("Delete failed", { error: err.message });
  } finally {
    showDeleteConfirm.value = false;
    deleteTargetId.value = null;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Payment Dashboard</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading analytics...</p>
      </div>
      <div v-else class="dashboard-container">
        <div class="summary-section">
          <div class="summary-card total">
            <div class="summary-icon">💰</div>
            <div class="summary-content">
              <span class="summary-label">Total Reservations</span>
              <span class="summary-value">{{ totalReservations }}</span>
            </div>
          </div>
          <div
            v-for="status in paymentStatusOrder"
            :key="status"
            class="summary-card"
            :class="status"
          >
            <div class="summary-content">
              <span class="summary-label">{{
                paymentDisplayLabels[status]
              }}</span>
              <span class="summary-value">{{ summary[status] }}</span>
            </div>
            <div
              class="summary-indicator"
              :style="{ backgroundColor: paymentBarColors[status] }"
            ></div>
          </div>
        </div>

        <div class="dashboard-card chart-card">
          <h2 class="card-title">Payment Distribution</h2>
          <div class="bar-chart">
            <div
              v-for="status in paymentStatusOrder"
              :key="status"
              class="bar-row"
            >
              <div class="bar-label">{{ paymentDisplayLabels[status] }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: barWidth(status),
                    backgroundColor: paymentBarColors[status],
                  }"
                ></div>
                <span class="bar-value">{{ summary[status] }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card table-card">
          <h2 class="card-title">Reservation Details</h2>
          <div class="filters">
            <select v-model="filterPaymentStatus" class="filter-select">
              <option value="">All Payment Statuses</option>
              <option
                v-for="status in paymentStatusOrder"
                :key="status"
                :value="status"
              >
                {{ paymentDisplayLabels[status] }}
              </option>
            </select>
            <select v-model="filterResStatus" class="filter-select">
              <option value="">All Reservation Statuses</option>
              <option value="pending">Pending</option>
              <option value="seated">Seated</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <TableView
            :fields="tableFields"
            :collection="filteredReservations"
            @onSelectedReservation="handleSelectedReservation"
          />
        </div>
      </div>
    </div>

    <PopupBox
      :is-open="isPopupOpen"
      :header-text="popupHeaderText"
      :is-closable="true"
      @close-modal="closePopup"
    >
      <template #popup-content>
        <EditReservation
          v-if="popupHeaderText === 'Edit Reservation'"
          :reservation="selectedReservation"
          :is-modal="true"
          @on-edited="refreshData"
        />
      </template>
    </PopupBox>

    <PopupBox
      :is-open="showDeleteConfirm"
      header-text="Confirm Delete"
      :is-closable="true"
      @close-modal="closeDeleteConfirm"
    >
      <template #popup-content>
        <div class="confirm-content">
          <p>Are you sure you want to permanently delete this reservation?</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="closeDeleteConfirm">
              Cancel
            </button>
            <button class="btn btn-danger" @click="confirmDelete">
              Delete
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
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
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

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: var(--card-padding);
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.summary-card.total {
  background-color: #1f2937;
  color: white;
  border-color: #1f2937;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-family: "Inter-Light";
  font-size: 13px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card.total .summary-label {
  color: #d1d5db;
}

.summary-value {
  font-family: "Inter-Bold";
  font-size: 28px;
  color: var(--primary-black);
}

.summary-card.total .summary-value {
  color: white;
}

.summary-indicator {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.dashboard-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0 0 20px 0;
}

.chart-card {
  margin-bottom: 4px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bar-label {
  width: 140px;
  text-align: right;
  font-size: 14px;
  font-family: "Inter-Medium";
  color: var(--primary-black);
}

.bar-track {
  flex: 1;
  height: 36px;
  background-color: #f3f4f6;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-value {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-family: "Inter-Bold";
  font-size: 14px;
  color: var(--primary-black);
  z-index: 1;
}

.table-card .filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 14px;
  border: 1px solid var(--lighter-gray);
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  background-color: white;
  min-width: 180px;
  color: var(--primary-black);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

@media screen and (min-width: 640px) {
  .summary-section {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
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

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
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
</style>

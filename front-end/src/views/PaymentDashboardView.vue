<script setup>
import { ref, computed, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import paymentAPI from "@/services/paymentAPI";
import TableView from "@/components/TableView.vue";
import PopupBox from "@/components/PopupBox.vue";
import EditReservation from "@/components/EditReservation.vue";
import logger from "@/utils/logger";
import { getApiErrorMessage } from "@/utils/apiError";

const loading = ref(true);
const reservations = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(25);
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
  unpaid: "#9a9389",
  deposit: "#d97706",
  partial: "#f59e0b",
  paid: "#365314",
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

const totalPages = computed(() => {
  return Math.max(Math.ceil(total.value / pageSize.value), 1);
});

const goToPage = (target) => {
  const clamped = Math.min(Math.max(1, target), totalPages.value || 1);
  if (clamped === page.value) return;
  page.value = clamped;
  loadData();
};

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
      reservationAPI.getReservations({
        page: page.value,
        pageSize: pageSize.value,
      }),
      reservationAPI.getPaymentSummary(),
    ]);
    const payload = resRes.data;
    reservations.value = payload.collection || [];
    total.value = payload.total || reservations.value.length;
    summary.value = summaryRes.data.summary;
  } catch (err) {
    logger.error("Failed to load payment dashboard", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const showDeleteConfirm = ref(false);
const deleteTargetId = ref(null);

const showRefundModal = ref(false);
const refundTarget = ref(null);
const refundAmount = ref("");
const refundReason = ref("");
const refundError = ref("");

const openRefund = (reservation) => {
  refundTarget.value = reservation;
  refundAmount.value = "";
  refundReason.value = "";
  refundError.value = "";
  showRefundModal.value = true;
};

const submitRefund = async () => {
  refundError.value = "";
  if (
    !refundTarget.value?.id ||
    !refundAmount.value ||
    parseFloat(refundAmount.value) <= 0
  ) {
    refundError.value = "Enter a valid refund amount.";
    return;
  }
  try {
    const paymentId = refundTarget.value.paymentId || refundTarget.value.id;
    await paymentAPI.refundPayment(refundTarget.value.id, paymentId, {
      amount: parseFloat(refundAmount.value),
      reason: refundReason.value || null,
      idempotencyKey: `${refundTarget.value.id}-${paymentId}-${Date.now()}`,
    });
    showRefundModal.value = false;
    await loadData();
  } catch (err) {
    refundError.value = getApiErrorMessage(err, "Refund failed");
  }
};

const handleSelectedReservation = async (item) => {
  if (!item?.id) return;
  const action = item.action;
  if (action === "edit") {
    openPopup({ headerText: "Edit Reservation" });
    selectedReservation.value = item;
  } else if (action === "delete") {
    deleteTargetId.value = item.id;
    showDeleteConfirm.value = true;
  } else if (action === "refund") {
    openRefund(item);
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
    <PageHeader title="Payments" subtitle="Track revenue and payment status" />
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
          <div v-if="total > pageSize" class="pager">
            <button
              class="pager-btn"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              Previous
            </button>
            <span class="pager-info">
              Page {{ page }} of {{ totalPages }} ({{ total }} entries)
            </span>
            <button
              class="pager-btn"
              :disabled="page >= totalPages"
              @click="goToPage(page + 1)"
            >
              Next
            </button>
          </div>
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

    <PopupBox
      :is-open="showRefundModal"
      header-text="Refund Payment"
      :is-closable="true"
      @close-modal="showRefundModal = false"
    >
      <template #popup-content>
        <div class="confirm-content">
          <p>
            Issue a refund for <strong>{{ refundTarget?.name }}</strong
            >?
          </p>
          <div class="field">
            <label class="field-label">Amount</label>
            <input
              v-model="refundAmount"
              type="number"
              step="0.01"
              min="0.01"
              class="field-input"
              placeholder="0.00"
            />
          </div>
          <div class="field">
            <label class="field-label">Reason</label>
            <input
              v-model="refundReason"
              class="field-input"
              placeholder="Optional reason"
            />
          </div>
          <div v-if="refundError" class="error-msg">{{ refundError }}</div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showRefundModal = false">
              Cancel
            </button>
            <button class="btn btn-danger" @click="submitRefund">Refund</button>
          </div>
        </div>
      </template>
    </PopupBox>
  </div>
</template>

<style scoped>
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
  padding: var(--space-20) var(--space-5);
  gap: var(--space-4);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-weight: 300;
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

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.summary-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--card-padding);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.summary-card.total {
  background-color: var(--ink);
  color: white;
  border-color: var(--ink);
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.summary-label {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card.total .summary-label {
  color: var(--neutral-200);
}

.summary-value {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-3xl, 1.75rem);
  color: var(--ink);
}

.summary-card.total .summary-value {
  color: white;
}

.summary-indicator {
  width: 4px;
  height: 36px;
  border-radius: var(--radius-sm, 2px);
  flex-shrink: 0;
}

.dashboard-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}

.card-title {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--ink);
  margin: 0 0 var(--space-5) 0;
}

.chart-card {
  margin-bottom: var(--space-1);
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3-5);
}

.bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.bar-label {
  width: 140px;
  text-align: right;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  font-weight: 500;
  color: var(--ink);
}

.bar-track {
  flex: 1;
  height: 36px;
  background-color: var(--neutral-100);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: var(--radius-lg);
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-value {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--ink);
  z-index: 1;
}

.table-card .filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}

.filter-select {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: var(--text-sm);
  background-color: var(--surface);
  min-width: 180px;
  color: var(--ink);
  transition: border-color var(--duration-150) var(--ease-in-out),
    box-shadow var(--duration-150) var(--ease-in-out);
}

.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

@media screen and (min-width: 640px) {
  .summary-section {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.confirm-content p {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: var(--text-base);
  color: var(--ink);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}

.btn-danger:hover {
  background: var(--rose-100);
}

.btn-secondary {
  background: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--neutral-100);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-150) var(--ease-in-out);
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.pager-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager-btn:not(:disabled):hover {
  border-color: var(--accent);
  color: var(--accent);
}

.pager-info {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.pager-total {
  color: var(--ink-muted);
}
</style>

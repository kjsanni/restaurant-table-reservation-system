<template>
  <div class="wallet-pass-approval">
    <div class="page-header">
      <div>
        <button class="back-btn" @click="goBack" aria-label="Back to events">
          <span class="mdi mdi:arrow-left"></span>
          Back
        </button>
        <h1>Wallet Pass Requests</h1>
        <p class="subtitle">Review and manage pending wallet pass signing requests</p>
      </div>
      <button class="btn-refresh" v-tap-scale @click="load" :disabled="loading">
        <span class="mdi mdi:refresh" :class="{ 'spin': loading }"></span>
        Refresh
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="error" class="error-state">
        <span class="mdi mdi:alert-circle-outline"></span>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="load">Retry</button>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        <span class="mdi mdi:check-circle-outline"></span>
        <h3>No pending requests</h3>
        <p>All wallet pass signing requests have been reviewed.</p>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Event</th>
              <th>Requester</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>
                <span class="request-id">#{{ item.id }}</span>
              </td>
              <td>
                <div class="cell-primary">Event {{ item.eventId }}</div>
              </td>
              <td>
                <div class="requester">
                  <span class="mdi mdi:account-outline"></span>
                  {{ item.requester?.username || item.requester?.email || "Unknown" }}
                </div>
              </td>
              <td>
                <span class="amount">{{ formatCurrency(item.amount, item.currency) }}</span>
              </td>
              <td>
                <span class="payment-ref" :title="item.paymentReference">
                  {{ item.paymentReference ? truncate(item.paymentReference, 16) : "—" }}
                </span>
              </td>
              <td>
                <span class="date">{{ formatDate(item.createdAt) }}</span>
              </td>
              <td class="actions-cell">
                <button
                  class="btn-approve"
                  v-tap-scale
                  :disabled="processing[item.id]"
                  @click="approve(item)"
                >
                  <span class="mdi mdi:check"></span>
                  {{ processing[item.id] ? "Approving..." : "Approve" }}
                </button>
                <button
                  class="btn-reject"
                  v-tap-scale
                  :disabled="processing[item.id]"
                  @click="openRejectModal(item)"
                >
                  <span class="mdi mdi:close"></span>
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="rejectTarget"
      class="modal-overlay"
      @click.self="closeRejectModal"
    >
      <div class="modal" role="dialog" aria-labelledby="reject-title">
        <div class="modal-header">
          <h3 id="reject-title">Reject Request #{{ rejectTarget.id }}</h3>
          <button class="btn-close" @click="closeRejectModal" aria-label="Close">
            <span class="mdi mdi:close"></span>
          </button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="reject-notes">Rejection reason <span class="required">*</span></label>
            <textarea
              id="reject-notes"
              v-model="rejectNotes"
              rows="4"
              class="field-input"
              placeholder="Provide a reason for rejection..."
              :class="{ 'input-error': rejectNotesError }"
            ></textarea>
            <p v-if="rejectNotesError" class="field-error">{{ rejectNotesError }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeRejectModal">
            Cancel
          </button>
          <button
            class="btn-reject-primary"
            :disabled="!rejectNotes.trim()"
            @click="confirmReject"
          >
            <span class="mdi mdi:close"></span>
            Reject Request
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";

interface WalletPassRequest {
  id: number;
  eventId: number;
  status: string;
  amount: number;
  currency: string;
  paymentReference?: string;
  requester: { id: number; username?: string; email?: string } | null;
  createdAt: string;
}

const router = useRouter();
const route = useRoute();
const toast = useToastStore();

const eventId = computed(() => Number(route.params.eventId));
const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<WalletPassRequest[]>([]);
const processing = ref<Record<number, boolean>>({});
const rejectTarget = ref<WalletPassRequest | null>(null);
const rejectNotes = ref("");
  const rejectNotesError = ref("");

const load = async () => {
  if (!eventId.value) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await eventPortalAPI.listPendingApproval(eventId.value);
    items.value = (res.data?.requests || res.data || []) as WalletPassRequest[];
  } catch (err) {
    error.value = "Failed to load wallet pass requests";
    toast.add(error.value, "error", 4000);
  } finally {
    loading.value = false;
  }
};

const approve = async (item: WalletPassRequest) => {
  processing.value[item.id] = true;
  try {
    const res = await eventPortalAPI.approveRequest(item.eventId, item.id);
    const message = res.data?.message || "Request approved";
    toast.add(message, "success", 4000);
    items.value = items.value.filter((i) => i.id !== item.id);
  } catch (err) {
    toast.add("Failed to approve request", "error", 4000);
  } finally {
    processing.value[item.id] = false;
  }
};

const openRejectModal = (item: WalletPassRequest) => {
  rejectTarget.value = item;
  rejectNotes.value = "";
  rejectNotesError.value = "";
};

const closeRejectModal = () => {
  rejectTarget.value = null;
  rejectNotes.value = "";
  rejectNotesError.value = "";
};

const confirmReject = async () => {
  if (!rejectTarget.value) return;
  if (!rejectNotes.value.trim()) {
    rejectNotesError.value = "Rejection reason is required";
    return;
  }

  processing.value[rejectTarget.value.id] = true;
  try {
    const res = await eventPortalAPI.rejectRequest(rejectTarget.value.eventId, rejectTarget.value.id);
    const message = res.data?.message || "Request rejected";
    toast.add(message, "success", 4000);
    items.value = items.value.filter((i) => i.id !== rejectTarget.value!.id);
    closeRejectModal();
  } catch (err) {
    toast.add("Failed to reject request", "error", 4000);
  } finally {
    if (rejectTarget.value) {
      processing.value[rejectTarget.value.id] = false;
    }
  }
};

const formatCurrency = (value: number, currency = "GHS") => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncate = (value: string, length: number) => {
  if (!value) return "—";
  return value.length > length ? value.substring(0, length) + "..." : value;
};

const goBack = () => {
  router.push({ name: "event-management" });
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.wallet-pass-approval {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}
.page-header > div {
  flex: 1;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: var(--space-3);
  transition: background var(--duration-150) var(--ease-in-out);
}
.back-btn:hover {
  background: var(--neutral-50);
}
.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}
.subtitle {
  color: var(--neutral-500);
  margin: var(--space-1) 0 0;
}
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}
.btn-refresh:hover:not(:disabled) {
  background: var(--neutral-50);
}
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}
.error-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-700);
}
.error-state .mdi {
  font-size: 48px;
  color: var(--danger);
  display: block;
  margin-bottom: var(--space-3);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.empty-state .mdi {
  font-size: 48px;
  color: var(--success);
  display: block;
  margin-bottom: var(--space-3);
}
.empty-state h3 {
  margin: 0 0 var(--space-2);
  color: var(--neutral-900);
  font-size: 18px;
  font-weight: 600;
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--neutral-100);
  vertical-align: middle;
}
.data-table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.data-table tbody tr:hover {
  background: var(--neutral-50);
}
.cell-primary {
  font-weight: 600;
  color: var(--neutral-900);
}
.requester {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  color: var(--neutral-700);
}
.requester .mdi {
  font-size: 16px;
  color: var(--neutral-400);
}
.amount {
  font-weight: 600;
  color: var(--neutral-900);
  font-variant-numeric: tabular-nums;
}
.payment-ref {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--neutral-500);
  background: var(--neutral-100);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}
.date {
  font-size: 13px;
  color: var(--neutral-500);
  white-space: nowrap;
}
.request-id {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--neutral-600);
  background: var(--neutral-100);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.btn-approve {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--success);
  color: var(--white);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-150) var(--ease-in-out);
}
.btn-approve:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-approve:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-reject {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--danger);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}
.btn-reject:hover:not(:disabled) {
  background: var(--danger);
  color: var(--white);
}
.btn-reject:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}
.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--neutral-500);
  font-size: 20px;
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}
.btn-close:hover {
  background: var(--neutral-100);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: var(--space-2);
}
.required {
  color: var(--danger);
}
.field-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color var(--duration-150) var(--ease-in-out);
}
.field-input:focus {
  outline: none;
  border-color: var(--brand-600);
}
.input-error {
  border-color: var(--danger);
}
.field-error {
  margin: var(--space-1) 0 0;
  font-size: 12px;
  color: var(--danger);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--duration-150) var(--ease-in-out);
}
.btn-secondary:hover {
  background: var(--neutral-50);
}
.btn-reject-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--danger);
  color: var(--white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-150) var(--ease-in-out);
}
.btn-reject-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-reject-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

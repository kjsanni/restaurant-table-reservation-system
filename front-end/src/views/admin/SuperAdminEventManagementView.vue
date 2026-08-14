<template>
  <div class="event-management">
    <div class="page-header">
      <div>
        <h1>Events</h1>
        <p class="subtitle">Manage events and ticket sales across tenants</p>
      </div>
      <button class="btn-primary" v-tap-scale @click="openCreateModal">
        + New Event
      </button>
    </div>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'events' }"
        @click="activeTab = 'events'"
      >
        Events
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'wallet-passes' }"
        @click="activeTab = 'wallet-passes'"
      >
        Wallet Pass Requests
      </button>
    </div>

    <div v-show="activeTab === 'events'">
      <div class="filters">
        <input
          v-model="searchQuery"
          placeholder="Search events..."
          class="search-input"
          @input="debouncedLoad"
        />
        <select v-model="filterStatus" class="filter-select" @change="load">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <select v-model="filterVertical" class="filter-select" @change="load">
          <option value="">All Verticals</option>
          <option value="restaurant">Restaurant</option>
          <option value="salon">Salon</option>
          <option value="event">Event</option>
        </select>
      </div>

      <div class="card">
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="items.length === 0" class="empty-state">
          No events found
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Tenant</th>
                <th>Date</th>
                <th>Status</th>
                <th>Tickets</th>
                <th>Bookings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>#{{ item.id }}</td>
                <td>
                  <div class="cell-primary">{{ item.name }}</div>
                  <div class="cell-secondary">
                    {{ item.eventType || "General" }}
                  </div>
                </td>
                <td>{{ item.tenant?.name || item.tenantId }}</td>
                <td>{{ formatDate(item.eventDate) }}</td>
                <td>
                  <span class="badge" :class="statusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <span v-if="item.isTicketed" class="badge badge-info">
                    Ticketed
                  </span>
                  <span v-else class="badge">Free</span>
                </td>
                <td>{{ item._bookingCount || 0 }}</td>
                <td class="actions-cell">
                  <button class="btn-sm" @click="viewItem(item)">View</button>
                  <button class="btn-sm" @click="editItem(item)">Edit</button>
                  <button class="btn-sm btn-danger" @click="removeItem(item)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'wallet-passes'" class="card">
      <div v-if="walletPassLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="walletPassRequests.length === 0" class="empty-state">
        No wallet pass requests found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event</th>
              <th>Tenant</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Apple</th>
              <th>Google</th>
              <th>Samsung</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in walletPassRequests" :key="req.id">
              <td>#{{ req.id }}</td>
              <td>
                <div class="cell-primary">
                  {{ req.event?.name || `Event #${req.eventId}` }}
                </div>
                <div class="cell-secondary">
                  {{
                    req.event?.eventDate ? formatDate(req.event.eventDate) : ""
                  }}
                </div>
              </td>
              <td>{{ req.tenant?.name || req.tenantId }}</td>
              <td>
                <span class="badge" :class="passStatusClass(req.status)">
                  {{ passStatusLabel(req.status) }}
                </span>
              </td>
              <td>{{ req.currency }} {{ req.amount.toFixed(2) }}</td>
              <td>
                <span class="badge" :class="passStatusClass(req.paymentStatus)">
                  {{ req.paymentStatus }}
                </span>
              </td>
              <td>
                <span
                  v-if="req.platformStatuses?.apple"
                  class="badge"
                  :class="passStatusClass(req.platformStatuses.apple)"
                >
                  {{ req.platformStatuses.apple }}
                </span>
                <span v-else class="cell-secondary">—</span>
              </td>
              <td>
                <span
                  v-if="req.platformStatuses?.google"
                  class="badge"
                  :class="passStatusClass(req.platformStatuses.google)"
                >
                  {{ req.platformStatuses.google }}
                </span>
                <span v-else class="cell-secondary">—</span>
              </td>
              <td>
                <span
                  v-if="req.platformStatuses?.samsung"
                  class="badge"
                  :class="passStatusClass(req.platformStatuses.samsung)"
                >
                  {{ req.platformStatuses.samsung }}
                </span>
                <span v-else class="cell-secondary">—</span>
              </td>
              <td>{{ formatDate(req.createdAt) }}</td>
              <td class="actions-cell">
                <button
                  v-if="req.status === 'pending'"
                  class="btn-sm btn-danger"
                  @click="openReview(req, 'reject')"
                >
                  Reject
                </button>
                <button
                  v-if="req.status === 'pending'"
                  class="btn-sm"
                  @click="openReview(req, 'approve')"
                  style="margin-left: 4px"
                >
                  Approve
                </button>
                <button
                  v-else-if="
                    req.status === 'approved' || req.status === 'signed'
                  "
                  class="btn-sm"
                  disabled
                >
                  Processing…
                </button>
                <span v-else class="cell-secondary">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="selectedItem"
      class="modal-overlay"
      @click.self="selectedItem = null"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedItem.id ? "Edit Event" : "New Event" }}</h3>
          <button class="btn-close" @click="selectedItem = null">×</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" class="field-input" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="field-input"
            ></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Event Type</label>
              <select v-model="form.eventType" class="field-input">
                <option value="">Select type</option>
                <option value="concert">Concert</option>
                <option value="conference">Conference</option>
                <option value="party">Party</option>
                <option value="workshop">Workshop</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="field">
              <label>Status</label>
              <select v-model="form.status" class="field-input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Venue</label>
              <input v-model="form.venue" class="field-input" />
            </div>
            <div class="field">
              <label>Address</label>
              <input v-model="form.address" class="field-input" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Date</label>
              <input v-model="form.eventDate" type="date" class="field-input" />
            </div>
            <div class="field">
              <label>Start Time</label>
              <input v-model="form.startTime" type="time" class="field-input" />
            </div>
            <div class="field">
              <label>End Time</label>
              <input v-model="form.endTime" type="time" class="field-input" />
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Capacity</label>
              <input
                v-model.number="form.capacity"
                type="number"
                class="field-input"
              />
            </div>
            <div class="field">
              <label>
                <input type="checkbox" v-model="form.isTicketed" />
                Ticketed Event
              </label>
            </div>
            <div class="field">
              <label>
                <input type="checkbox" v-model="form.requiresApproval" />
                Requires Approval
              </label>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="selectedItem = null">
            Cancel
          </button>
          <button class="btn-primary" :disabled="saving" @click="saveItem">
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="reviewModalOpen"
      class="modal-overlay"
      @click.self="reviewModalOpen = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>
            {{
              selectedRequest?.status === "pending"
                ? "Review Wallet Pass Request"
                : "View Request"
            }}
          </h3>
          <button class="btn-close" @click="reviewModalOpen = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedRequest" class="review-details">
            <div class="review-row">
              <strong>Request ID</strong>
              <span>#{{ selectedRequest.id }}</span>
            </div>
            <div class="review-row">
              <strong>Amount</strong>
              <span
                >{{ selectedRequest.currency }}
                {{ selectedRequest.amount.toFixed(2) }}</span
              >
            </div>
            <div class="review-row">
              <strong>Payment Reference</strong>
              <span>{{ selectedRequest.paymentReference || "N/A" }}</span>
            </div>
            <div class="review-row">
              <strong>Event</strong>
              <span>{{
                selectedRequest.event?.name ||
                `Event #${selectedRequest.eventId}`
              }}</span>
            </div>
            <div class="review-row">
              <strong>Tenant ID</strong>
              <span>{{ selectedRequest.tenantId }}</span>
            </div>
            <div class="field">
              <label for="reviewNotes">Review Notes</label>
              <textarea
                id="reviewNotes"
                v-model="reviewNotes"
                rows="3"
                class="field-input"
                placeholder="Add notes for the tenant..."
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="reviewModalOpen = false">
            Cancel
          </button>
          <button
            v-if="selectedRequest?.status === 'pending'"
            class="btn-danger"
            :disabled="saving"
            @click="rejectRequest"
          >
            Reject
          </button>
          <button
            v-if="selectedRequest?.status === 'pending'"
            class="btn-primary"
            :disabled="saving"
            @click="approveRequest"
          >
            Approve &amp; Enqueue Signing
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import eventPortalAPI from "@/services/eventPortalAPI";
import adminAPI from "@/services/adminAPI";
import { buildQueryString } from "@/services/admin/verticalAPI";

interface Event {
  id: number;
  name: string;
  description?: string;
  eventType?: string;
  venue?: string;
  address?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status: string;
  isTicketed: boolean;
  requiresApproval?: boolean;
  tenantId?: number;
  tenant?: { id: number; name: string };
  _bookingCount?: number;
}

interface WalletPassRequest {
  id: number;
  eventId: number;
  tenantId: number;
  tenant?: { id: number; name: string };
  event?: { id: number; name: string; eventDate: string };
  status: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  platformStatuses: Record<string, string>;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const router = useRouter();
const toast = useToastStore();
const items = ref<Event[]>([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref("");
const filterStatus = ref("");
const filterVertical = ref("");
const selectedItem = ref<Event | null>(null);
const form = ref<Partial<Event>>({});
const activeTab = ref<"events" | "wallet-passes">("events");
const walletPassRequests = ref<WalletPassRequest[]>([]);
const walletPassLoading = ref(false);
const reviewModalOpen = ref(false);
const selectedRequest = ref<WalletPassRequest | null>(null);
const reviewNotes = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    draft: "badge-muted",
    published: "badge-success",
    cancelled: "badge-danger",
    completed: "badge-info",
  };
  return map[status] || "badge";
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "TBD";
  return new Date(dateStr + "T00:00:00").toLocaleDateString();
};

const passStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending_payment: "badge-warning",
    pending: "badge-info",
    approved: "badge-success",
    signed: "badge-info",
    completed: "badge-success",
    rejected: "badge-danger",
    failed: "badge-danger",
    cancelled: "badge-muted",
  };
  return map[status] || "badge";
};

const passStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending_payment: "Payment Pending",
    pending: "Pending Review",
    approved: "Approved",
    signed: "Signed",
    completed: "Completed",
    rejected: "Rejected",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return map[status] || status;
};

const loadWalletPassRequests = async () => {
  walletPassLoading.value = true;
  try {
    const res = await adminAPI.listWalletPassRequests();
    walletPassRequests.value = res.data?.requests || res.data || [];
  } catch (err) {
    toast.add("Failed to load wallet pass requests", "error", 4000);
  } finally {
    walletPassLoading.value = false;
  }
};

const approveRequest = async () => {
  if (!selectedRequest.value) return;
  try {
    await adminAPI.approveWalletPassRequest(
      selectedRequest.value.id,
      reviewNotes.value
    );
    toast.add("Request approved. Signing job enqueued.", "success", 3000);
    reviewModalOpen.value = false;
    reviewNotes.value = "";
    selectedRequest.value = null;
    loadWalletPassRequests();
  } catch (err) {
    toast.add("Failed to approve request", "error", 4000);
  }
};

const rejectRequest = async () => {
  if (!selectedRequest.value) return;
  try {
    await adminAPI.rejectWalletPassRequest(
      selectedRequest.value.id,
      reviewNotes.value
    );
    toast.add("Request rejected", "success", 3000);
    reviewModalOpen.value = false;
    reviewNotes.value = "";
    selectedRequest.value = null;
    loadWalletPassRequests();
  } catch (err) {
    toast.add("Failed to reject request", "error", 4000);
  }
};

const openReview = (req: WalletPassRequest, action: "approve" | "reject") => {
  selectedRequest.value = req;
  reviewNotes.value = req.reviewNotes || "";
  reviewModalOpen.value = true;
};

const load = async () => {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (searchQuery.value) params.search = searchQuery.value;
    if (filterStatus.value) params.status = filterStatus.value;
    const qs = buildQueryString(params);
    const res = await eventPortalAPI.getEvents(qs);
    items.value = (res.data?.rows || res.data || []) as Event[];
  } catch (err) {
    toast.add("Failed to load events", "error", 4000);
  } finally {
    loading.value = false;
  }
};

const debouncedLoad = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
};

const openCreateModal = () => {
  selectedItem.value = null;
  form.value = {
    status: "draft",
    isTicketed: false,
    requiresApproval: false,
    eventDate: new Date().toISOString().split("T")[0],
  };
};

const editItem = (item: Event) => {
  selectedItem.value = item;
  form.value = { ...item };
};

const viewItem = (item: Event) => {
  router.push(`/super-admin/events/${item.id}`);
};

const saveItem = async () => {
  saving.value = true;
  try {
    if (selectedItem.value?.id) {
      await eventPortalAPI.updateEvent(selectedItem.value.id, form.value);
      toast.add("Event updated", "success", 3000);
    } else {
      await eventPortalAPI.createEvent(form.value);
      toast.add("Event created", "success", 3000);
    }
    selectedItem.value = null;
    load();
  } catch (err) {
    toast.add("Failed to save event", "error", 4000);
  } finally {
    saving.value = false;
  }
};

const removeItem = async (item: Event) => {
  if (!confirm(`Delete event "${item.name}"?`)) return;
  try {
    await eventPortalAPI.deleteEvent(item.id);
    items.value = items.value.filter((i) => i.id !== item.id);
    toast.add("Event deleted", "success", 3000);
  } catch (err) {
    toast.add("Failed to delete event", "error", 4000);
  }
};

onMounted(() => {
  load();
  loadWalletPassRequests();
});
</script>

<style scoped>
.event-management {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
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
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
}
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
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
.cell-secondary {
  font-size: 13px;
  color: var(--neutral-500);
}
.badge {
  display: inline-block;
  padding: 2px var(--space-3);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.badge-success {
  background: #dcfce7;
  color: #166534;
}
.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}
.badge-info {
  background: #dbeafe;
  color: #1e40af;
}
.badge-muted {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.badge-warning {
  background: #fef3c2;
  color: #924004;
}
.actions-cell {
  display: flex;
  gap: var(--space-2);
}
.review-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--neutral-100);
}
.review-row:last-child {
  border-bottom: none;
}
.review-row strong {
  font-size: 12px;
  font-weight: 600;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.review-row span {
  font-size: 14px;
  color: var(--neutral-900);
}
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  font-size: 12px;
  cursor: pointer;
}
.btn-sm:hover {
  background: var(--neutral-50);
}
.btn-sm.btn-danger {
  border-color: #fecaca;
  color: #dc2626;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--neutral-500);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
.modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 640px;
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
}
.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--neutral-500);
}
.field {
  margin-bottom: var(--space-4);
}
.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: var(--space-1);
}
.field-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.field-input:focus {
  outline: none;
  border-color: var(--brand-600);
}
.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-sm);
  background: var(--brand-600);
  color: var(--white);
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) {
  background: var(--brand-700);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--neutral-700);
  font-weight: 600;
  cursor: pointer;
}
</style>

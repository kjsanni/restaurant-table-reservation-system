<script setup>
import { ref, computed, onMounted } from "vue";
import waitlistAPI from "@/services/waitlistAPI";
import tableAPI from "@/services/tableAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const canAddToWaitlist = computed(() => authStore.user?.role === "staff");

const entries = ref([]);
const stats = ref({
  waiting: 0,
  seated: 0,
  expired: 0,
  cancelled: 0,
  total: 0,
});
const loading = ref(true);
const showPopup = ref(false);
const popupMode = ref(null);
const selectedEntry = ref(null);
const showDeleteModal = ref(false);
const deleteTargetId = ref(null);

const form = ref({
  name: "",
  partySize: 2,
  phone: "",
  email: "",
  desiredTime: "",
  notes: "",
});

const freeTables = ref([]);
const actionLoading = ref(false);
const actionError = ref("");

const loadData = async () => {
  loading.value = true;
  try {
    const [entriesRes, statsRes] = await Promise.all([
      waitlistAPI.getEntries(),
      waitlistAPI.getStats(),
    ]);
    entries.value = entriesRes.data.entries;
    stats.value = statsRes.data.stats;
  } catch (err) {
    logger.error("Failed to load waitlist", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const openAdd = () => {
  popupMode.value = "add";
  selectedEntry.value = null;
  form.value = {
    name: "",
    partySize: 2,
    phone: "",
    email: "",
    desiredTime: "",
    notes: "",
  };
  showPopup.value = true;
};

const openSeat = async (entry) => {
  popupMode.value = "seat";
  selectedEntry.value = entry;
  actionError.value = "";
  try {
    const res = await tableAPI.getTables();
    freeTables.value = res.data.collection.filter(
      (t) => !t.reservationId && !t.isBlocked
    );
  } catch {
    freeTables.value = [];
  }
  showPopup.value = true;
};

const openCancel = (entry) => {
  popupMode.value = "cancel";
  selectedEntry.value = entry;
  actionError.value = "";
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
  selectedEntry.value = null;
  popupMode.value = null;
  actionError.value = "";
  freeTables.value = [];
};

const handleAdd = async () => {
  actionLoading.value = true;
  actionError.value = "";
  try {
    await waitlistAPI.addEntry(form.value);
    closePopup();
    await loadData();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to add to waitlist");
  } finally {
    actionLoading.value = false;
  }
};

const handleSeat = async (tableId) => {
  if (!selectedEntry.value || !tableId) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await waitlistAPI.seatEntry(selectedEntry.value.id);
    await loadData();
    closePopup();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to seat guest");
  } finally {
    actionLoading.value = false;
  }
};

const handleCancel = async () => {
  if (!selectedEntry.value) return;
  actionLoading.value = true;
  actionError.value = "";
  try {
    await waitlistAPI.cancelEntry(selectedEntry.value.id);
    closePopup();
    await loadData();
  } catch (err) {
    actionError.value = getApiErrorMessage(err, "Failed to cancel entry");
  } finally {
    actionLoading.value = false;
  }
};

const handleDelete = async (entry) => {
  deleteTargetId.value = entry.id;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  try {
    await waitlistAPI.deleteEntry(deleteTargetId.value);
    await loadData();
  } catch (err) {
    logger.error("Failed to delete", { error: err.message });
  } finally {
    showDeleteModal.value = false;
    deleteTargetId.value = null;
  }
};

const handleExpire = async () => {
  try {
    await waitlistAPI.expireOld();
    await loadData();
  } catch (err) {
    logger.error("Failed to expire entries", { error: err.message });
  }
};

const formatTime = (time) => {
  if (!time) return "ASAP";
  return time;
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="header">
      <h1>Waitlist / Queue Management</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading waitlist...</p>
      </div>
      <template v-else>
        <div class="stats-row">
          <div class="stat-pill waiting">
            <span class="stat-icon">⏳</span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.waiting }}</span>
              <span class="stat-label">Waiting</span>
            </div>
          </div>
          <div class="stat-pill seated">
            <span class="stat-icon">✅</span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.seated }}</span>
              <span class="stat-label">Seated</span>
            </div>
          </div>
          <div class="stat-pill expired">
            <span class="stat-icon">⌛</span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.expired }}</span>
              <span class="stat-label">Expired</span>
            </div>
          </div>
          <div class="stat-pill total">
            <span class="stat-icon">📊</span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button
            v-if="canAddToWaitlist"
            class="btn btn-primary"
            @click="openAdd"
          >
            + Add to Waitlist
          </button>
          <button class="btn btn-secondary" @click="handleExpire">
            Expire Old Entries
          </button>
        </div>

        <div v-if="entries.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No one on the waitlist</p>
        </div>
        <div v-else class="entries-grid">
          <div v-for="entry in entries" :key="entry.id" class="entry-card">
            <div class="entry-header">
              <div class="guest-identity">
                <span class="guest-avatar">
                  {{ (entry.name || "G")[0]?.toUpperCase() }}
                </span>
                <div class="guest-info">
                  <span class="guest-name">{{ entry.name }}</span>
                  <span class="party-badge">{{ entry.partySize }} guests</span>
                </div>
              </div>
              <span class="status-badge waiting">Waiting</span>
            </div>

            <div class="entry-body">
              <div v-if="entry.phone" class="info-item">
                <span class="info-icon">📞</span>
                <span>{{ entry.phone }}</span>
              </div>
              <div v-if="entry.email" class="info-item">
                <span class="info-icon">✉️</span>
                <span>{{ entry.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🕐</span>
                <span
                  >Desired: {{ formatTime(entry.desiredTime) || "ASAP" }}</span
                >
              </div>
              <div v-if="entry.notes" class="info-item notes-item">
                <span class="info-icon">📝</span>
                <span>{{ entry.notes }}</span>
              </div>
            </div>

            <div class="entry-footer">
              <button
                class="btn btn-success btn-sm"
                @click="openSeat(entry)"
                title="Seat Guest"
              >
                🪑 Seat
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="openCancel(entry)"
                title="Cancel"
              >
                ✕
              </button>
              <button
                class="btn btn-outline btn-sm"
                @click="handleDelete(entry)"
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </template>

      <PopupBox
        :is-open="showPopup"
        :header-text="
          popupMode === 'add'
            ? 'Add to Waitlist'
            : popupMode === 'seat'
            ? 'Seat Guest'
            : 'Cancel Entry'
        "
        :is-closable="true"
        @close-modal="closePopup"
      >
        <template #popup-content>
          <div class="popup-body">
            <div v-if="actionError" class="error-msg">{{ actionError }}</div>

            <div v-if="popupMode === 'add'" class="form-section">
              <div class="field">
                <label class="field-label">Name *</label>
                <input
                  v-model="form.name"
                  class="field-input"
                  placeholder="Guest name"
                />
              </div>
              <div class="field">
                <label class="field-label">Party Size</label>
                <input
                  type="number"
                  v-model="form.partySize"
                  class="field-input"
                  min="1"
                />
              </div>
              <div class="field">
                <label class="field-label">Phone</label>
                <input
                  v-model="form.phone"
                  class="field-input"
                  placeholder="Phone number"
                />
              </div>
              <div class="field">
                <label class="field-label">Email</label>
                <input
                  v-model="form.email"
                  class="field-input"
                  placeholder="Email address"
                />
              </div>
              <div class="field">
                <label class="field-label">Desired Time</label>
                <input
                  type="time"
                  v-model="form.desiredTime"
                  class="field-input"
                />
              </div>
              <div class="field">
                <label class="field-label">Notes</label>
                <textarea
                  v-model="form.notes"
                  class="field-input"
                  rows="2"
                  placeholder="Special requests..."
                ></textarea>
              </div>
              <div class="popup-actions">
                <button class="btn btn-secondary" @click="closePopup">
                  Cancel
                </button>
                <button
                  class="btn btn-primary"
                  @click="handleAdd"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? "Adding..." : "Add to Waitlist" }}
                </button>
              </div>
            </div>

            <div v-else-if="popupMode === 'seat'" class="form-section">
              <p class="seat-info">
                Assign a table to <strong>{{ selectedEntry?.name }}</strong> ({{
                  selectedEntry?.partySize
                }}
                guests)
              </p>
              <div v-if="freeTables.length === 0" class="empty-msg">
                No free tables available
              </div>
              <div class="table-grid">
                <button
                  v-for="table in freeTables"
                  :key="table.id"
                  class="table-btn"
                  @click="handleSeat(table.id)"
                  :disabled="actionLoading"
                >
                  Table {{ table.name || table.id }}
                </button>
              </div>
              <div class="popup-actions">
                <button class="btn btn-secondary" @click="closePopup">
                  Cancel
                </button>
              </div>
            </div>

            <div v-else-if="popupMode === 'cancel'" class="form-section">
              <p class="cancel-text">
                Cancel waitlist entry for
                <strong>{{ selectedEntry?.name }}</strong
                >?
              </p>
              <div class="popup-actions">
                <button class="btn btn-secondary" @click="closePopup">
                  Keep
                </button>
                <button
                  class="btn btn-danger"
                  @click="handleCancel"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? "Cancelling..." : "Yes, Cancel" }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </PopupBox>

      <PopupBox
        :is-open="showDeleteModal"
        header-text="Confirm Delete"
        :is-closable="true"
        @close-modal="showDeleteModal = false"
      >
        <template #popup-content>
          <div class="confirm-content">
            <p>Are you sure you want to delete this waitlist entry?</p>
            <div class="confirm-actions">
              <button
                class="btn btn-secondary"
                @click="showDeleteModal = false"
              >
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-family: "Inter-Bold";
  font-size: 22px;
  color: var(--primary-black);
}

.stat-label {
  font-family: "Inter-Medium";
  font-size: 11px;
  color: var(--secondary-gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-pill.waiting {
  border-left: 4px solid #f59e0b;
}

.stat-pill.seated {
  border-left: 4px solid #22c55e;
}

.stat-pill.expired {
  border-left: 4px solid #ef4444;
}

.stat-pill.total {
  border-left: 4px solid #3b82f6;
}

.action-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.entries-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.entry-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.entry-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.guest-identity {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.guest-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  color: var(--primary-blue);
  font-family: "Inter-Bold";
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guest-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.guest-name {
  font-family: "Inter-Medium";
  font-size: 15px;
  color: var(--primary-black);
}

.party-badge {
  font-family: "Inter-Medium";
  font-size: 12px;
  background: #eef2ff;
  color: var(--primary-blue);
  padding: 2px 10px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

.status-badge {
  font-family: "Inter-Medium";
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  text-transform: capitalize;
  flex-shrink: 0;
}

.status-badge.waiting {
  background: #fffbeb;
  color: #b45309;
}

.entry-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
}

.info-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.info-item.notes-item {
  background: #fffbeb;
  color: #92400e;
  padding: 8px 10px;
  border-radius: 8px;
  margin-top: 4px;
}

.entry-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.popup-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
}

.field-input {
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

textarea.field-input {
  resize: vertical;
}

.seat-info {
  font-size: 14px;
  color: var(--primary-black);
  margin-bottom: 4px;
  line-height: 1.5;
}

.cancel-text {
  font-size: 14px;
  color: var(--primary-black);
  margin-bottom: 4px;
  line-height: 1.5;
}

.empty-msg {
  text-align: center;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  padding: 20px;
}

.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 10px;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 13px;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin: 10px 0;
}

.table-btn {
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: all 0.2s;
}

.table-btn:hover:not(:disabled) {
  background: #eef2ff;
  border-color: var(--primary-blue);
  color: var(--primary-blue);
}

.table-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-secondary {
  background-color: #f3f4f6;
  color: var(--primary-black);
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.btn-success {
  background-color: #d1fae5;
  color: #065f46;
}

.btn-success:hover {
  background-color: #a7f3d0;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #f0f0f0;
  color: var(--primary-black);
}

.btn-outline:hover {
  background-color: #f9fafb;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

@media screen and (min-width: 640px) {
  .entries-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
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
</style>

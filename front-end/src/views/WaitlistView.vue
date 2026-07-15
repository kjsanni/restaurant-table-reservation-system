<script setup>
import { ref, computed, onMounted } from "vue";
import waitlistAPI from "@/services/waitlistAPI";
import tableAPI from "@/services/tableAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";
import logger from "@/utils/logger";
import { useAuthStore } from "@/stores/auth";
import PageHeader from "@/components/PageHeader.vue";
import { Icon } from "@iconify/vue";

const authStore = useAuthStore();
const canAddToWaitlist = computed(
  () => authStore.user?.role === "admin" || authStore.user?.role === "staff"
);

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
    <PageHeader title="Waitlist" subtitle="Manage guest queue and seating" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading waitlist...</p>
      </div>
      <template v-else>
        <div class="stats-row">
          <div class="stat-pill waiting">
            <span class="stat-icon"
              ><Icon icon="mdi:clock-outline" width="20" height="20"
            /></span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.waiting }}</span>
              <span class="stat-label">Waiting</span>
            </div>
          </div>
          <div class="stat-pill seated">
            <span class="stat-icon"
              ><Icon icon="mdi:check-circle" width="20" height="20"
            /></span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.seated }}</span>
              <span class="stat-label">Seated</span>
            </div>
          </div>
          <div class="stat-pill expired">
            <span class="stat-icon"
              ><Icon icon="mdi:clock-alert" width="20" height="20"
            /></span>
            <div class="stat-text">
              <span class="stat-number">{{ stats.expired }}</span>
              <span class="stat-label">Expired</span>
            </div>
          </div>
          <div class="stat-pill total">
            <span class="stat-icon"
              ><Icon icon="mdi:chart-bar" width="20" height="20"
            /></span>
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
          <span class="empty-icon"
            ><Icon icon="mdi:inbox" width="48" height="48"
          /></span>
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
                <span class="info-icon"
                  ><Icon icon="mdi:phone" width="16" height="16"
                /></span>
                <span>{{ entry.phone }}</span>
              </div>
              <div v-if="entry.email" class="info-item">
                <span class="info-icon"
                  ><Icon icon="mdi:email" width="16" height="16"
                /></span>
                <span>{{ entry.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-icon"
                  ><Icon icon="mdi:clock-outline" width="16" height="16"
                /></span>
                <span
                  >Desired: {{ formatTime(entry.desiredTime) || "ASAP" }}</span
                >
              </div>
              <div v-if="entry.notes" class="info-item notes-item">
                <span class="info-icon"
                  ><Icon icon="mdi:note-text" width="16" height="16"
                /></span>
                <span>{{ entry.notes }}</span>
              </div>
            </div>

            <div class="entry-footer">
              <button
                class="btn btn-success btn-sm"
                @click="openSeat(entry)"
                title="Seat Guest"
              >
                <Icon icon="mdi:seat" width="16" height="16" /> Seat
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="openCancel(entry)"
                title="Cancel"
              >
                <Icon icon="mdi:close" width="16" height="16" />
              </button>
              <button
                class="btn btn-outline btn-sm"
                @click="handleDelete(entry)"
                title="Delete"
              >
                <Icon icon="mdi:delete" width="16" height="16" />
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
.main-wrapper {
  min-height: 100vh;
  background: var(--restaurant-background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-6) var(--x-spacing-mobile);
  padding: 0;
  max-width: 1400px;
  width: 100%;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin: var(--space-8) var(--x-spacing-desktop);
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-20) var(--space-6);
  gap: var(--space-4);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--restaurant-border);
  border-top-color: var(--restaurant-accent);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

@media (min-width: 640px) {
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.stat-pill:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.waiting .stat-icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warm-600);
}

.seated .stat-icon {
  background: rgba(22, 163, 74, 0.1);
  color: var(--color-success-600);
}

.expired .stat-icon {
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-accent-600);
}

.total .stat-icon {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info-600);
}

.stat-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--restaurant-charcoal);
  letter-spacing: var(--tracking-tight);
}

.stat-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--restaurant-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-pill.waiting {
  border-left: 4px solid var(--color-warm-500);
}

.stat-pill.seated {
  border-left: 4px solid var(--color-success-600);
}

.stat-pill.expired {
  border-left: 4px solid var(--color-accent-600);
}

.stat-pill.total {
  border-left: 4px solid var(--color-info-500);
}

.action-bar {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}

.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-6);
  color: var(--restaurant-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.empty-icon {
  opacity: 0.4;
  color: var(--restaurant-secondary);
}

.entries-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .entries-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.entry-card {
  background: var(--restaurant-surface);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-out);
}

.entry-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.guest-identity {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 0;
}

.guest-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-primary-100);
  color: var(--restaurant-charcoal);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guest-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.guest-name {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--restaurant-charcoal);
}

.party-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  background: var(--color-primary-50);
  color: var(--restaurant-secondary);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  display: inline-block;
  width: fit-content;
}

.status-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  white-space: nowrap;
  text-transform: capitalize;
  flex-shrink: 0;
}

.status-badge.waiting {
  background: var(--color-warm-100);
  color: var(--color-warm-600);
}

.entry-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
}

.info-icon {
  display: flex;
  align-items: center;
  color: var(--restaurant-secondary);
  flex-shrink: 0;
}

.info-item.notes-item {
  background: var(--color-warm-50);
  color: #92400e;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.entry-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--restaurant-border);
}

.popup-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--restaurant-charcoal);
}

.field-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-charcoal);
  background: var(--restaurant-surface);
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--restaurant-accent);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

textarea.field-input {
  resize: vertical;
}

.seat-info {
  font-size: var(--text-sm);
  color: var(--restaurant-charcoal);
  margin-bottom: var(--space-2);
  line-height: var(--leading-relaxed);
}

.cancel-text {
  font-size: var(--text-sm);
  color: var(--restaurant-charcoal);
  margin-bottom: var(--space-2);
  line-height: var(--leading-relaxed);
}

.empty-msg {
  text-align: center;
  color: var(--restaurant-secondary);
  font-family: var(--font-sans);
  padding: var(--space-4);
}

.error-msg {
  background: var(--color-accent-50);
  color: var(--color-accent-600);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--restaurant-border);
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-2);
  margin: var(--space-3) 0;
}

.table-btn {
  padding: var(--space-3);
  border: 1px solid var(--restaurant-border);
  border-radius: var(--radius-md);
  background: var(--restaurant-surface);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.table-btn:hover:not(:disabled) {
  background: var(--color-primary-50);
  border-color: var(--restaurant-accent);
  color: var(--restaurant-accent);
}

.table-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.btn-primary {
  background: linear-gradient(
    135deg,
    var(--restaurant-charcoal) 0%,
    var(--restaurant-slate) 100%
  );
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-primary-50);
  color: var(--restaurant-charcoal);
  border: 1px solid var(--restaurant-border);
}

.btn-secondary:hover {
  background: var(--color-primary-100);
}

.btn-danger {
  background: var(--color-accent-50);
  color: var(--color-accent-600);
}

.btn-danger:hover {
  background: var(--color-accent-100);
}

.btn-success {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.btn-success:hover {
  background: var(--color-success-100);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--restaurant-border);
  color: var(--restaurant-charcoal);
}

.btn-outline:hover {
  background: var(--color-primary-50);
}

.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.confirm-content p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--restaurant-charcoal);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>

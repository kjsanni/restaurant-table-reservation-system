<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import tableAPI from "@/services/tableAPI";
import { useAuthStore } from "@/stores/auth";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import ErrorMessage from "@/components/ErrorMessage.vue";
import SuccessMessage from "@/components/SuccessMessage.vue";
import logger from "@/utils/logger";
import PageHeader from "@/components/PageHeader.vue";

const authStore = useAuthStore();
const canManageTables = computed(
  () => authStore.user?.permissions?.manage_tables === true
);

const tables = ref([]);
const waitingStaff = ref([]);
const loading = ref(true);
const showMaintenanceDialog = ref(false);
const selectedTable = ref(null);
const maintenanceNotes = ref("");
const showStaffDialog = ref(false);
const staffDialogMode = ref(null);
const showConfirmModal = ref(false);
const confirmTarget = ref(null);
const showErrorModal = ref(false);
const errorMessage = ref("");

const MAX_TABLES_PER_STAFF = 5;

const showAddDialog = ref(false);
const newTable = ref({
  name: "",
  capacity: "",
});
const addValidationErrors = ref(null);
const addEmptyFieldsError = ref(null);
const addIsSuccessful = ref(false);
const addStaffList = ref([]);
const addLoadingStaff = ref(false);
const addSelectedStaffIds = ref([]);

const openAddDialog = async () => {
  showAddDialog.value = true;
  addIsSuccessful.value = false;
  addEmptyFieldsError.value = null;
  addValidationErrors.value = null;
  newTable.value = { name: "", capacity: "" };
  addSelectedStaffIds.value = [];
  await loadAddWaitingStaff();
};

const closeAddDialog = () => {
  showAddDialog.value = false;
};

const loadAddWaitingStaff = async () => {
  addLoadingStaff.value = true;
  try {
    const res = await tableAPI.getWaitingStaff();
    addStaffList.value = res.data.staff;
  } catch (err) {
    addStaffList.value = [];
  } finally {
    addLoadingStaff.value = false;
  }
};

const registerTable = async () => {
  addValidationErrors.value = null;
  addEmptyFieldsError.value = null;
  addIsSuccessful.value = false;
  try {
    const payload = {
      name: newTable.value.name,
      capacity: newTable.value.capacity,
      staffIds: addSelectedStaffIds.value,
    };
    await tableAPI.registerTable(payload);
    addIsSuccessful.value = true;
    addSelectedStaffIds.value = [];
    await loadTables();
    setTimeout(() => {
      closeAddDialog();
    }, 1200);
  } catch (err) {
    addEmptyFieldsError.value = getApiErrorMessage(err);
    addValidationErrors.value = getApiErrors(err);
  }
};

onMounted(async () => {
  await loadTables();
  await loadWaitingStaff();
});

const loadTables = async () => {
  loading.value = true;
  try {
    const res = await tableAPI.getTables();
    tables.value = res.data.collection;
  } catch (err) {
    logger.error("Failed to load tables", { error: err.message });
  } finally {
    loading.value = false;
  }
};

const loadWaitingStaff = async () => {
  try {
    const res = await tableAPI.getWaitingStaff();
    waitingStaff.value = res.data.staff;
  } catch (err) {
    logger.error("Failed to load waiting staff", { error: err.message });
  }
};

const blockTable = async (table) => {
  if (table.isBlocked) {
    await tableAPI.unblockTable(table.id);
  } else {
    selectedTable.value = table;
    showMaintenanceDialog.value = true;
  }
  await loadTables();
};

const confirmBlock = async () => {
  if (selectedTable.value) {
    await tableAPI.blockTable(selectedTable.value.id, maintenanceNotes.value);
    showMaintenanceDialog.value = false;
    maintenanceNotes.value = "";
    await loadTables();
  }
};

const unseatTable = async (table) => {
  openConfirm(table);
};

const openAssignStaff = (table) => {
  selectedTable.value = table;
  staffDialogMode.value = "assign";
  showStaffDialog.value = true;
};

const openUnassignStaff = (table) => {
  selectedTable.value = table;
  staffDialogMode.value = "unassign";
  showStaffDialog.value = true;
};

const openConfirm = (table, action) => {
  confirmTarget.value = table;
  showConfirmModal.value = true;
};

const closeConfirm = () => {
  showConfirmModal.value = false;
  confirmTarget.value = null;
};

const showError = (message) => {
  errorMessage.value = message;
  showErrorModal.value = true;
};

const closeError = () => {
  showErrorModal.value = false;
  errorMessage.value = "";
};

const confirmAction = async () => {
  if (!confirmTarget.value) return;
  try {
    await tableAPI.freeTable(confirmTarget.value.id);
    await loadTables();
  } catch (err) {
    showError(err.response?.data?.message || "Failed to unseat table");
  } finally {
    closeConfirm();
  }
};

const closeStaffDialog = () => {
  showStaffDialog.value = false;
  selectedTable.value = null;
  staffDialogMode.value = null;
};

const assignStaff = async (userId) => {
  if (!selectedTable.value) return;
  try {
    await tableAPI.assignStaff(selectedTable.value.id, userId);
    closeStaffDialog();
    await Promise.all([loadTables(), loadWaitingStaff()]);
  } catch (err) {
    showError(getApiErrorMessage(err, "Failed to assign staff"));
  }
};

const unassignStaff = async (userId) => {
  if (!selectedTable.value) return;
  try {
    await tableAPI.unassignStaff(selectedTable.value.id, userId);
    closeStaffDialog();
    await Promise.all([loadTables(), loadWaitingStaff()]);
  } catch (err) {
    showError(getApiErrorMessage(err, "Failed to unassign staff"));
  }
};

const availableStaffForAssign = computed(() => {
  if (!selectedTable.value) return [];
  const assignedStaffIds = selectedTable.value.Users?.map((u) => u.id) || [];
  return waitingStaff.value.filter(
    (s) =>
      !assignedStaffIds.includes(s.id) && s.tableCount < MAX_TABLES_PER_STAFF
  );
});

const assignedStaffForTable = computed(() => {
  if (!selectedTable.value) return [];
  return selectedTable.value.Users || [];
});

const staffAtLimit = (staff) => {
  return staff.tableCount >= MAX_TABLES_PER_STAFF;
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Tables" subtitle="Manage seating and floor plan" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tables...</p>
      </div>
      <div v-else class="tables-container">
        <div class="actions-row">
          <RouterLink
            v-if="canManageTables"
            to="/admin/floorplan"
            class="btn btn-secondary floorplan-link"
          >
            🗺️ Floor Plan Editor
          </RouterLink>
          <button class="btn btn-primary" @click="openAddDialog">
            + Add Table
          </button>
        </div>
        <div class="table-grid">
          <div
            v-for="table in tables"
            :key="table.id"
            class="table-card"
            :class="{
              blocked: table.isBlocked,
              occupied: !table.isBlocked && table.isOccupied,
              available: !table.isBlocked && !table.isOccupied,
            }"
          >
            <div class="table-header">
              <div class="table-identity">
                <span class="table-icon">🍽️</span>
                <div class="table-title-group">
                  <h3 class="table-name">{{ table.name }}</h3>
                  <span class="table-id">ID: {{ table.id }}</span>
                </div>
              </div>
              <span
                class="status-chip"
                :class="
                  table.isBlocked
                    ? 'blocked'
                    : table.isOccupied
                    ? 'occupied'
                    : 'free'
                "
              >
                {{
                  table.isBlocked
                    ? "Blocked"
                    : table.isOccupied
                    ? "Occupied"
                    : "Free"
                }}
              </span>
            </div>

            <div class="table-meta">
              <div class="meta-item">
                <span class="meta-icon">👥</span>
                <span class="meta-text">Capacity: {{ table.capacity }}</span>
              </div>
              <div
                v-if="table.isBlocked && table.maintenanceNotes"
                class="blocked-reason"
              >
                {{ table.maintenanceNotes }}
              </div>
            </div>

            <div
              v-if="
                table.reservation &&
                (table.reservation.Customer?.name || table.reservation.name)
              "
              class="reservation-section"
            >
              <span class="section-label">Current Reservation</span>
              <div class="reservation-info">
                <span class="reservation-name">{{
                  table.reservation.Customer?.name || table.reservation.name
                }}</span>
                <span class="reservation-meta">
                  {{ table.reservation.people }} guests ·
                  {{ table.reservation.resTime }}
                </span>
              </div>
            </div>

            <div class="staff-section" v-if="table.users && table.users.length">
              <span class="section-label">Assigned Staff</span>
              <div class="staff-list">
                <span
                  v-for="staff in table.users"
                  :key="staff.id"
                  class="staff-chip"
                >
                  {{ staff.username }}
                  <button
                    class="remove-staff-btn"
                    @click.stop="openUnassignStaff(table, staff.id)"
                    title="Unassign"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>

            <div class="table-actions">
              <button
                class="action-btn"
                :class="table.isBlocked ? 'btn-unblock' : 'btn-block'"
                @click="blockTable(table)"
              >
                {{ table.isBlocked ? "Unblock" : "Block" }}
              </button>
              <button
                v-if="!table.users || table.users.length === 0"
                class="action-btn btn-staff"
                @click="openAssignStaff(table)"
                :disabled="table.isBlocked"
              >
                👤 Assign Staff
              </button>
              <button
                v-if="table.isOccupied && !table.isBlocked"
                class="action-btn btn-unseat"
                @click="unseatTable(table)"
                title="Customer left — free the table"
              >
                ✅ Unseat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showMaintenanceDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Block Table</h3>
          <p class="modal-subtitle">
            Blocking <strong>{{ selectedTable?.name }}</strong>
          </p>
          <div class="field">
            <label class="field-label">Maintenance Notes</label>
            <textarea
              v-model="maintenanceNotes"
              placeholder="Reason for blocking..."
              class="field-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button
              class="btn btn-secondary"
              @click="showMaintenanceDialog = false"
            >
              Cancel
            </button>
            <button class="btn btn-warning" @click="confirmBlock">
              Block Table
            </button>
          </div>
        </div>
      </div>

      <div v-if="showStaffDialog" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">
            {{
              staffDialogMode === "assign" ? "Assign Staff" : "Unassign Staff"
            }}
          </h3>
          <p class="modal-subtitle">
            Table <strong>{{ selectedTable?.name }}</strong>
          </p>

          <div v-if="staffDialogMode === 'assign'" class="field">
            <label class="field-label">Select Staff Member</label>
            <div class="staff-options">
              <div
                v-if="availableStaffForAssign.length === 0"
                class="empty-msg"
              >
                No available staff. All staff are either assigned or at the
                5-table limit.
              </div>
              <button
                v-for="staff in availableStaffForAssign"
                :key="staff.id"
                class="staff-option-btn"
                @click="assignStaff(staff.id)"
              >
                <span class="staff-option-name">{{ staff.username }}</span>
                <span class="staff-option-count">
                  {{ staff.tableCount }}/{{ MAX_TABLES_PER_STAFF }} tables
                </span>
              </button>
            </div>
          </div>

          <div v-else class="field">
            <label class="field-label">Currently Assigned</label>
            <div class="staff-options">
              <div v-if="assignedStaffForTable.length === 0" class="empty-msg">
                No staff assigned to this table.
              </div>
              <button
                v-for="staff in assignedStaffForTable"
                :key="staff.id"
                class="staff-option-btn assigned"
                @click="unassignStaff(staff.id)"
              >
                <span class="staff-option-name">{{ staff.username }}</span>
                <span class="unassign-hint">Click to remove</span>
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeStaffDialog">
              Close
            </button>
          </div>
        </div>
      </div>

      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">Confirm Unseat</h3>
          <p class="modal-subtitle">
            Unseat table <strong>{{ confirmTarget?.name }}</strong
            >? This will mark the reservation as completed.
          </p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeConfirm">
              Cancel
            </button>
            <button class="btn btn-danger" @click="confirmAction">
              Unseat
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAddDialog" class="modal-overlay">
        <div class="modal modal-large">
          <h3 class="modal-title">Add Table</h3>
          <p class="modal-subtitle">
            Create a new table and optionally assign waiting staff.
          </p>

          <form @submit.prevent="registerTable">
            <div class="field">
              <label class="field-label">Table Name</label>
              <input
                v-model="newTable.name"
                type="text"
                placeholder="Enter table name..."
                class="field-input"
              />
              <div
                v-if="
                  addValidationErrors &&
                  addValidationErrors.name &&
                  addValidationErrors.name.length
                "
                class="field-error"
              >
                {{ addValidationErrors.name[0] }}
              </div>
            </div>

            <div class="field">
              <label class="field-label">Capacity</label>
              <input
                v-model="newTable.capacity"
                type="number"
                placeholder="Enter capacity..."
                class="field-input"
              />
              <div
                v-if="
                  addValidationErrors &&
                  addValidationErrors.capacity &&
                  addValidationErrors.capacity.length
                "
                class="field-error"
              >
                {{ addValidationErrors.capacity[0] }}
              </div>
            </div>

            <ErrorMessage
              :error-flag="addEmptyFieldsError"
              :error-message="addEmptyFieldsError"
            />
            <SuccessMessage
              :is-successful="addIsSuccessful"
              success-message="Table added successfully!"
            />

            <div class="staff-section">
              <h3 class="staff-title">Assign Waiting Staff</h3>
              <p class="staff-hint">
                Each waiter can handle up to 5 tables. Staff already at capacity
                are disabled.
              </p>
              <div v-if="addLoadingStaff" class="staff-loading">
                Loading staff...
              </div>
              <div v-else-if="addStaffList.length === 0" class="staff-empty">
                No waiting staff available.
              </div>
              <div v-else class="staff-grid">
                <label
                  v-for="staff in addStaffList"
                  :key="staff.id"
                  :class="['staff-chip', { disabled: staff.tableCount >= 5 }]"
                >
                  <input
                    type="checkbox"
                    :value="staff.id"
                    :disabled="staff.tableCount >= 5"
                    v-model="addSelectedStaffIds"
                  />
                  <span class="staff-name">{{ staff.username }}</span>
                  <span
                    :class="['staff-count', { full: staff.tableCount >= 5 }]"
                  >
                    {{ staff.tableCount }}/5 tables
                  </span>
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeAddDialog"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="addIsSuccessful"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <PopupBox
      :is-open="showErrorModal"
      header-text="Error"
      :is-closable="true"
      @close-modal="closeError"
    >
      <template #popup-content>
        <div class="error-content">
          <p>{{ errorMessage }}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="closeError">OK</button>
          </div>
        </div>
      </template>
    </PopupBox>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background);
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  margin: var(--page-margin-y) var(--page-margin-x);
  padding: 0;
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
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

.loading-state p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.tables-container {
  display: flex;
  flex-direction: column;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: background-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out),
    transform var(--duration-fast) var(--ease-in-out);
  box-shadow: var(--shadow-sm);
}

.table-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.table-card.available {
  border-left: 4px solid var(--earth-600);
}

.table-card.occupied {
  border-left: 4px solid var(--rose-600);
  opacity: 0.9;
}

.table-card.blocked {
  border-left: 4px solid var(--neutral-500);
  background: var(--neutral-50);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.table-identity {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 0;
}

.table-icon {
  display: flex;
  align-items: center;
  font-size: 20px;
  line-height: 1;
}

.table-title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.table-name {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
  margin: 0;
}

.table-id {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
}

.status-chip {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  white-space: nowrap;
  text-transform: capitalize;
}

.status-chip.free {
  background: var(--earth-50);
  color: var(--earth-600);
}

.status-chip.occupied {
  background: var(--rose-50);
  color: var(--rose-600);
}

.status-chip.blocked {
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.table-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.meta-icon {
  display: flex;
  align-items: center;
  font-size: var(--text-sm);
}

.meta-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}

.blocked-reason {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--rose-50);
  color: var(--rose-600);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
}

.reservation-section {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--neutral-50);
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-200);
}

.section-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-secondary);
  margin-bottom: var(--space-2);
  display: block;
}

.reservation-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.reservation-name {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--ink);
}

.reservation-meta {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
}

.staff-section {
  margin-top: var(--space-4);
}

.table-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
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

.btn-block {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-block:hover {
  background-color: var(--rose-100);
}

.btn-unblock {
  background-color: var(--earth-50);
  color: var(--earth-600);
}

.btn-unblock:hover {
  background-color: var(--earth-100);
}

.btn-staff {
  background-color: var(--neutral-100);
  color: var(--sky-600);
}

.btn-staff:hover:not(:disabled) {
  background-color: var(--neutral-200);
}

.btn-staff:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-unseat {
  background-color: var(--earth-50);
  color: var(--earth-600);
}

.btn-unseat:hover {
  background-color: var(--earth-100);
}

.staff-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 300px;
  overflow-y: auto;
}

.staff-option-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  transition: all var(--duration-fast) var(--ease-in-out);
}

.staff-option-btn:hover {
  background: var(--neutral-50);
  border-color: var(--accent);
}

.staff-option-btn.assigned {
  background: var(--rose-50);
  border-color: var(--rose-200);
}

.staff-option-btn.assigned:hover {
  background: var(--rose-100);
  border-color: var(--rose-600);
}

.staff-option-name {
  font-weight: 500;
}

.staff-option-count {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
}

.unassign-hint {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--rose-600);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.modal {
  background-color: var(--surface);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
}

.modal-title {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.modal-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  margin: var(--space-2) 0 0 0;
}

.field {
  margin-bottom: var(--space-4);
}

.field:last-of-type {
  margin-bottom: 0;
}

.field-label {
  display: block;
  margin-bottom: var(--space-1);
  font-weight: 600;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
}

.field-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  box-sizing: border-box;
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
  resize: vertical;
}

.field-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
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
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink-secondary) 100%);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--neutral-50);
  color: var(--ink);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--neutral-100);
}

.btn-warning {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-warning:hover {
  background-color: var(--rose-100);
}

.btn-danger {
  background-color: var(--rose-50);
  color: var(--rose-600);
}

.btn-danger:hover {
  background-color: var(--rose-100);
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.error-content p {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  margin: 0;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.empty-msg {
  text-align: center;
  color: var(--ink-secondary);
  font-family: var(--font-sans);
  padding: var(--space-4);
  font-size: var(--text-xs);
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.floorplan-link {
  margin-right: auto;
  text-decoration: none;
}

.modal-large {
  max-width: 520px;
}

.field-input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--duration-fast) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-in-out);
}

.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.field-error {
  color: var(--rose-600);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  margin-top: var(--space-1);
}

.staff-loading,
.staff-empty {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  padding: var(--space-2) 0;
}

.staff-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--ink);
  user-select: none;
}

.staff-chip:hover:not(.disabled) {
  border-color: var(--accent);
  background: var(--neutral-50);
}

.staff-chip.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--neutral-100);
  border-color: var(--neutral-200);
}

.staff-name {
  font-weight: 500;
}

.staff-count {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--ink-secondary);
  background: var(--neutral-100);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}

.staff-count.full {
  color: var(--rose-600);
  background: var(--rose-50);
  font-weight: 600;
}

.add-btn {
  font-family: var(--font-sans);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
</style>

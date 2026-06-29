<script setup>
import { ref, computed, onMounted } from "vue";
import tableAPI from "@/services/tableAPI";
import PopupBox from "@/components/PopupBox.vue";
import { getApiErrorMessage } from "@/utils/apiError";

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
    <div class="header">
      <h1>Table Management</h1>
    </div>
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading tables...</p>
      </div>
      <div v-else class="tables-container">
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
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/add-table-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0% 40%;
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

.tables-container {
  display: flex;
  flex-direction: column;
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.table-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.2s ease;
  box-shadow: var(--card-shadow);
}

.table-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.table-card.available {
  border-left: 4px solid #22c55e;
}

.table-card.occupied {
  border-left: 4px solid #ef4444;
  opacity: 0.9;
}

.table-card.blocked {
  border-left: 4px solid #6c757d;
  background: #fafafa;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.table-identity {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.table-icon {
  font-size: 20px;
  line-height: 1;
}

.table-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.table-name {
  font-family: "Inter-Bold";
  font-size: 16px;
  color: var(--primary-black);
  margin: 0;
}

.table-id {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.status-chip {
  font-family: "Inter-Medium";
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  text-transform: capitalize;
}

.status-chip.free {
  background: #d1fae5;
  color: #065f46;
}

.status-chip.occupied {
  background: #fee2e2;
  color: #991b1b;
}

.status-chip.blocked {
  background: #f3f4f6;
  color: #6b7280;
}

.table-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-icon {
  font-size: 14px;
}

.meta-text {
  font-family: "Inter-Light";
  font-size: 13px;
  color: var(--secondary-gray);
}

.blocked-reason {
  font-family: "Inter-Light";
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 8px 10px;
  border-radius: 6px;
  margin-top: 4px;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--btn-radius);
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-block {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-block:hover {
  background-color: #fee2e2;
}

.btn-unblock {
  background-color: #d1fae5;
  color: #065f46;
}

.btn-unblock:hover {
  background-color: #a7f3d0;
}

.btn-staff {
  background-color: #eef2ff;
  color: var(--primary-blue);
}

.btn-staff:hover:not(:disabled) {
  background-color: #dbeafe;
}

.btn-staff:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-unseat {
  background-color: #d1fae5;
  color: #065f46;
}

.btn-unseat:hover {
  background-color: #a7f3d0;
}

.staff-section {
  margin-top: 4px;
}

.section-label {
  font-family: "Inter-Medium";
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--secondary-gray);
  margin-bottom: 6px;
  display: block;
}

.staff-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.staff-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: var(--primary-blue);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Inter-Medium";
  font-size: 12px;
}

.remove-staff-btn {
  background: none;
  border: none;
  color: var(--primary-blue);
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
}

.remove-staff-btn:hover {
  color: #dc2626;
}

.staff-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.staff-option-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-family: "Inter-Medium";
  font-size: 13px;
  color: var(--primary-black);
  transition: all 0.15s;
}

.staff-option-btn:hover {
  background: #f9fafb;
  border-color: var(--primary-blue);
}

.staff-option-btn.assigned {
  background: #fef2f2;
  border-color: #fecaca;
}

.staff-option-btn.assigned:hover {
  background: #fee2e2;
  border-color: #dc2626;
}

.staff-option-name {
  font-weight: 500;
}

.staff-option-count {
  font-family: "Inter-Light";
  font-size: 12px;
  color: var(--secondary-gray);
}

.unassign-hint {
  font-family: "Inter-Light";
  font-size: 12px;
  color: #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  padding: 24px;
  border-radius: 14px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-family: "Inter-Bold";
  font-size: 18px;
  color: var(--primary-black);
  margin: 0;
}

.modal-subtitle {
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--secondary-gray);
  margin: 6px 0 20px 0;
}

.field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-family: "Inter-Medium";
  font-size: 14px;
  color: var(--primary-black);
}

.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  font-family: "Inter-Light";
  font-size: 14px;
  color: var(--primary-black);
  box-sizing: border-box;
  resize: vertical;
}

.field-textarea:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

.btn-warning {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-warning:hover {
  background-color: #fee2e2;
}

.btn-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.btn-danger:hover {
  background-color: #fee2e2;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-content p {
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

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.empty-msg {
  text-align: center;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
  padding: 16px;
  font-size: 13px;
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
</style>

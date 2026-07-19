<script setup>
import { ref, onMounted } from "vue";
import reservationAPI from "@/services/reservationAPI";
import groupAPI from "@/services/groupAPI";
import logger from "@/utils/logger";
import { getApiErrorMessage } from "@/utils/apiError";

const props = defineProps({
  reservation: Object,
});

const emit = defineEmits(["on-assigned", "on-unassigned"]);

const assignedStaff = ref([]);
const waitingStaff = ref([]);
const loading = ref(true);
const error = ref(null);

const loadAssignedStaff = async () => {
  try {
    const res = await reservationAPI.getAssignedStaff(props.reservation.id);
    assignedStaff.value = res.data.staff || [];
  } catch (err) {
    logger.error("Failed to load assigned staff", { error: err.message });
    assignedStaff.value = [];
  }
};

const loadWaitingStaff = async () => {
  try {
    const groupRes = await groupAPI.getGroupByName("waiting_staff");
    const group = groupRes.data.group;
    waitingStaff.value = group.Users || [];
  } catch (err) {
    logger.error("Failed to load waiting staff", { error: err.message });
    waitingStaff.value = [];
  }
};

const assignStaff = async (userId) => {
  try {
    await reservationAPI.assignStaff(props.reservation.id, userId);
    await loadAssignedStaff();
    emit("on-assigned");
  } catch (err) {
    error.value = getApiErrorMessage(err, "Failed to assign staff");
    logger.error("Failed to assign staff", { error: err.message });
  }
};

const unassignStaff = async (userId) => {
  try {
    await reservationAPI.unassignStaff(props.reservation.id, userId);
    await loadAssignedStaff();
    emit("on-unassigned");
  } catch (err) {
    error.value = getApiErrorMessage(err, "Failed to unassign staff");
    logger.error("Failed to unassign staff", { error: err.message });
  }
};

onMounted(async () => {
  try {
    await Promise.all([loadAssignedStaff(), loadWaitingStaff()]);
  } catch (err) {
    logger.error("Mount failed", { error: err.message });
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="assign-staff">
    <div v-if="loading" class="loading">Loading staff...</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>

      <div class="section">
        <h4>Assigned Staff ({{ assignedStaff.length }})</h4>
        <div v-if="assignedStaff.length === 0" class="empty">
          No staff assigned yet
        </div>
        <div v-else class="staff-list">
          <div
            v-for="staff in assignedStaff"
            :key="staff.id"
            class="staff-item"
          >
            <span class="staff-name">{{ staff.username }}</span>
            <button
              class="remove-btn"
              @click="unassignStaff(staff.id)"
              title="Unassign"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <div class="section">
        <h4>Available Waiting Staff</h4>
        <div v-if="waitingStaff.length === 0" class="empty">
          No waiting staff available
        </div>
        <div v-else class="staff-list">
          <div v-for="staff in waitingStaff" :key="staff.id" class="staff-item">
            <span class="staff-name">{{ staff.username }}</span>
            <button
              class="assign-btn"
              @click="assignStaff(staff.id)"
              :disabled="assignedStaff.some((s) => s.id === staff.id)"
            >
              {{
                assignedStaff.some((s) => s.id === staff.id)
                  ? "Assigned"
                  : "Assign"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assign-staff {
  min-height: 200px;
}
.section {
  margin-bottom: 20px;
}
.section h4 {
  font-family: var(--font-sans);
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 14px;
}
.empty {
  font-size: 13px;
  color: var(--ink-muted);
  padding: 10px;
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 300;
}
.staff-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.staff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background-color: var(--neutral-50);
}
.staff-name {
  font-family: "Inter-Medium";
  font-size: 14px;
}
.assign-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color var(--duration-150) var(--ease-in-out);
}

.assign-btn:disabled {
  background-color: var(--earth-100);
  color: var(--earth-600);
  cursor: not-allowed;
}

.assign-btn:not(:disabled) {
  background-color: var(--accent-500);
  color: white;
}
.assign-btn:not(:disabled):hover {
  background-color: var(--accent-600);
}
.remove-btn {
  background: none;
  border: none;
  color: var(--rose-500);
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  padding: 0 4px;
}
.remove-btn:hover {
  color: var(--rose-600);
}
.loading {
  text-align: center;
  padding: 40px;
  font-family: var(--font-sans);
  font-weight: 300;
}
.error {
  color: var(--rose-500);
  text-align: center;
  padding: 10px;
  margin-bottom: 15px;
  font-family: var(--font-sans);
  font-weight: 300;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import shiftAPI from "@/services/shiftAPI";
import logger from "@/utils/logger";

interface StaffShift {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  role?: string;
  userId: number;
  user?: { username?: string; role?: string };
}

const shifts = ref<StaffShift[]>([]);
const staff = ref<{ id: number; username: string; role?: string }[]>([]);
const loading = ref(true);
const submitting = ref(false);
const errorMsg = ref("");

const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabel = (day: string) => {
  const found = weekDays.find((d) => d.toLowerCase() === day.toLowerCase());
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : day;
};

const formatTime = (time: string) => {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

const loadData = async () => {
  loading.value = true;
  try {
    const [shiftsRes, staffRes] = await Promise.all([
      shiftAPI.getShifts(),
      shiftAPI.getStaff(),
    ]);
    const rawShifts = Array.isArray(shiftsRes.data)
      ? shiftsRes.data
      : shiftsRes.data?.shifts || shiftsRes.data?.data || [];
    shifts.value = rawShifts.map((s: any) => ({
      ...s,
      user: s.user || {},
    }));
    staff.value = Array.isArray(staffRes.data)
      ? staffRes.data
      : staffRes.data?.staff || staffRes.data?.data || [];
  } catch (err) {
    logger.error("Failed to load shifts", { error: err });
  } finally {
    loading.value = false;
  }
};

const userId = ref("");
const dayOfWeek = ref("monday");
const startTime = ref("09:00");
const endTime = ref("17:00");
const role = ref("");

const submitShift = async () => {
  submitting.value = true;
  errorMsg.value = "";
  try {
    const payload = {
      userId: Number(userId.value),
      dayOfWeek: dayOfWeek.value,
      startTime: startTime.value,
      endTime: endTime.value,
      role: role.value || null,
    };
    await shiftAPI.createShift(payload);
    userId.value = "";
    role.value = "";
    await loadData();
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : "Failed to create shift";
  } finally {
    submitting.value = false;
  }
};

const removeShift = async (id: number) => {
  if (!confirm("Remove this shift?")) return;
  try {
    await shiftAPI.deleteShift(id);
    shifts.value = shifts.value.filter((s) => s.id !== id);
  } catch (err) {
    logger.error("Failed to delete shift", { error: err });
  }
};

const groupedByDay = computed(() => {
  const map: Record<string, StaffShift[]> = {};
  weekDays.forEach((day) => {
    map[day] = shifts.value.filter((s) => s.dayOfWeek.toLowerCase() === day);
  });
  return map;
});

onMounted(loadData);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Staff Shifts</h1>
        <p>Weekly schedule for stylists and staff</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading shifts...</p>
      </div>

      <div v-else>
        <div class="form-panel">
          <h2>Add Shift</h2>
          <div class="form-grid">
            <div class="field">
              <label for="staff">Staff</label>
              <select id="staff" v-model="userId">
                <option value="">Select staff</option>
                <option v-for="s in staff" :key="s.id" :value="String(s.id)">
                  {{ s.username }} ({{ s.role || "staff" }})
                </option>
              </select>
            </div>
            <div class="field">
              <label for="day">Day</label>
              <select id="day" v-model="dayOfWeek">
                <option v-for="day in weekDays" :key="day" :value="day">
                  {{ dayLabel(day) }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="start">Start</label>
              <input id="start" type="time" v-model="startTime" />
            </div>
            <div class="field">
              <label for="end">End</label>
              <input id="end" type="time" v-model="endTime" />
            </div>
            <div class="field">
              <label for="role">Role</label>
              <input id="role" v-model="role" placeholder="e.g. Stylist" />
            </div>
            <div class="field-actions">
              <button
                class="btn-primary"
                :disabled="submitting || !userId"
                @click="submitShift"
              >
                <span v-if="!submitting">Add Shift</span>
                <span v-else>Saving...</span>
              </button>
            </div>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>

        <div class="shifts-board">
          <div v-for="day in weekDays" :key="day" class="shift-column">
            <div class="column-header">
              <h3>{{ dayLabel(day) }}</h3>
              <span class="column-count">{{ groupedByDay[day].length }}</span>
            </div>
            <div class="column-body">
              <div
                v-for="shift in groupedByDay[day]"
                :key="shift.id"
                class="shift-card"
              >
                <div class="shift-name">
                  {{ shift.user?.username || "Staff" }}
                </div>
                <div class="shift-time">
                  {{ formatTime(shift.startTime) }} —
                  {{ formatTime(shift.endTime) }}
                </div>
                <div v-if="shift.role" class="shift-role">{{ shift.role }}</div>
                <button class="btn-danger-sm" @click="removeShift(shift.id)">
                  Remove
                </button>
              </div>
              <div v-if="!groupedByDay[day].length" class="empty-cell">
                No shifts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}
.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}
.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
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
.form-panel {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  margin-bottom: 18px;
}
.form-panel h2 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--neutral-900);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.field input,
.field select {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
.field-actions {
  display: flex;
  align-items: flex-end;
}
.btn-primary {
  background: var(--brand-500);
  color: var(--white);
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-msg {
  margin-top: 10px;
  color: #b91c1c;
  font-size: 13px;
}
.shifts-board {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}
.shift-column {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
  overflow: hidden;
}
.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--neutral-200);
}
.column-header h3 {
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
}
.column-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--neutral-600);
  background: var(--neutral-100);
  padding: 2px 8px;
  border-radius: 999px;
}
.column-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 80px;
}
.shift-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px;
  background: var(--white);
}
.shift-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--neutral-900);
  margin-bottom: 4px;
}
.shift-time {
  font-size: 12px;
  color: var(--neutral-700);
  margin-bottom: 2px;
}
.shift-role {
  font-size: 11px;
  color: var(--neutral-600);
  margin-bottom: 6px;
}
.btn-danger-sm {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: var(--radius-md);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.empty-cell {
  text-align: center;
  color: var(--neutral-500);
  font-size: 12px;
  padding: 18px 0;
}

@media (max-width: 1100px) {
  .shifts-board {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 760px) {
  .shifts-board {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

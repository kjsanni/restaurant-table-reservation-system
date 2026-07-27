<script setup lang="ts">
import { ref, onMounted } from "vue";
import scheduleAPI from "@/services/scheduleAPI";
import logger from "@/utils/logger";

interface Holiday {
  id: number;
  date: string;
  name: string;
}

const holidays = ref<Holiday[]>([]);
const loading = ref(true);
const submitting = ref(false);
const errorMsg = ref("");
const name = ref("");
const date = ref("");

const loadHolidays = async () => {
  loading.value = true;
  try {
    const res = await scheduleAPI.getHolidays();
    holidays.value = res.data.holidays || res.data || [];
  } catch (err) {
    logger.error("Failed to load holidays", { error: err });
  } finally {
    loading.value = false;
  }
};

const submitHoliday = async () => {
  if (!name.value || !date.value) return;
  submitting.value = true;
  errorMsg.value = "";
  try {
    await scheduleAPI.createHoliday({ name: name.value, date: date.value });
    name.value = "";
    date.value = "";
    await loadHolidays();
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : "Failed to add holiday";
  } finally {
    submitting.value = false;
  }
};

const removeHoliday = async (id: number) => {
  if (!confirm("Remove this holiday?")) return;
  try {
    await scheduleAPI.deleteHoliday(id);
    holidays.value = holidays.value.filter((h) => h.id !== id);
  } catch (err) {
    logger.error("Failed to delete holiday", { error: err });
  }
};

onMounted(loadHolidays);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Salon Holidays</h1>
        <p>Days the salon is closed</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading holidays...</p>
      </div>

      <div v-else>
        <div class="form-card">
          <h3>Add Holiday</h3>
          <div class="form-row">
            <div class="field">
              <label for="name">Name</label>
              <input
                id="name"
                v-model="name"
                placeholder="e.g. Independence Day"
              />
            </div>
            <div class="field">
              <label for="date">Date</label>
              <input id="date" type="date" v-model="date" />
            </div>
            <div class="field-actions">
              <button
                class="btn-primary"
                :disabled="submitting || !name || !date"
                @click="submitHoliday"
              >
                <span v-if="!submitting">Add</span>
                <span v-else>Saving...</span>
              </button>
            </div>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </div>

        <div class="list-card">
          <h3>Upcoming Holidays</h3>
          <div v-if="!holidays.length" class="empty-state">
            No holidays configured.
          </div>
          <div v-else class="holiday-list">
            <div
              v-for="holiday in holidays"
              :key="holiday.id"
              class="holiday-row"
            >
              <div class="holiday-name">{{ holiday.name }}</div>
              <div class="holiday-date">{{ holiday.date }}</div>
              <button class="btn-danger-sm" @click="removeHoliday(holiday.id)">
                Remove
              </button>
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
.form-card,
.list-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  margin-bottom: 18px;
}
.form-card h3,
.list-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 14px;
  color: var(--neutral-900);
}
.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.field input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
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
.empty-state {
  color: var(--neutral-600);
  font-size: 13px;
  font-style: italic;
}
.holiday-list {
  display: flex;
  flex-direction: column;
}
.holiday-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--neutral-100);
}
.holiday-row:last-child {
  border-bottom: none;
}
.holiday-name {
  font-weight: 600;
  color: var(--neutral-900);
  flex: 1;
}
.holiday-date {
  font-size: 13px;
  color: var(--neutral-600);
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
</style>

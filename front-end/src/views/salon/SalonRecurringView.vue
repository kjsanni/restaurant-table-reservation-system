<script setup lang="ts">
import { ref, onMounted } from "vue";
import recurringAppointmentsAPI from "@/services/recurringAppointmentsAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const saving = ref(false);
const recurringAppointments = ref<any[]>([]);
const form = ref({
  customerId: "",
  serviceId: "",
  stylistId: "",
  stationId: "",
  frequency: "weekly",
  interval: 1,
  startDate: "",
  endDate: "",
  timeOfDay: "10:00",
  durationMinutes: 60,
});

const loadRecurring = async () => {
  loading.value = true;
  try {
    const res = await recurringAppointmentsAPI.getAll({ limit: 100 });
    recurringAppointments.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load recurring appointments", { error: err });
  } finally {
    loading.value = false;
  }
};

const createRecurring = async () => {
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      customerId: Number(form.value.customerId),
      serviceId: Number(form.value.serviceId),
      stylistId: form.value.stylistId ? Number(form.value.stylistId) : null,
      stationId: form.value.stationId ? Number(form.value.stationId) : null,
      interval: Number(form.value.interval),
      durationMinutes: Number(form.value.durationMinutes),
    };
    await recurringAppointmentsAPI.create(payload);
    loadRecurring();
    form.value = {
      customerId: "",
      serviceId: "",
      stylistId: "",
      stationId: "",
      frequency: "weekly",
      interval: 1,
      startDate: "",
      endDate: "",
      timeOfDay: "10:00",
      durationMinutes: 60,
    };
  } catch (err) {
    logger.error("Failed to create recurring appointment", { error: err });
  } finally {
    saving.value = false;
  }
};

onMounted(loadRecurring);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Recurring Appointments</h1>
        <p>Schedule repeating appointment patterns</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading recurring appointments...</p>
      </div>

      <div v-else class="stack">
        <div class="settings-card">
          <h3>New Recurring Appointment</h3>
          <div class="grid">
            <label>
              Customer ID
              <input v-model="form.customerId" class="field-input" />
            </label>
            <label>
              Service ID
              <input v-model="form.serviceId" class="field-input" />
            </label>
            <label>
              Frequency
              <select v-model="form.frequency" class="field-input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label>
              Interval
              <input
                v-model.number="form.interval"
                class="field-input"
                type="number"
                min="1"
              />
            </label>
            <label>
              Start Date
              <input v-model="form.startDate" class="field-input" type="date" />
            </label>
            <label>
              End Date (optional)
              <input v-model="form.endDate" class="field-input" type="date" />
            </label>
            <label>
              Time of Day
              <input v-model="form.timeOfDay" class="field-input" />
            </label>
            <label>
              Duration (minutes)
              <input
                v-model.number="form.durationMinutes"
                class="field-input"
                type="number"
              />
            </label>
          </div>
          <div class="form-actions">
            <button
              class="btn-primary"
              :disabled="saving"
              @click="createRecurring"
            >
              {{ saving ? "Saving..." : "Create Recurring" }}
            </button>
          </div>
        </div>

        <div class="settings-card">
          <h3>Active Recurrences</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Frequency</th>
                <th>Start</th>
                <th>End</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recurringAppointments" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.frequency }}</td>
                <td>{{ item.startDate }}</td>
                <td>{{ item.endDate || "—" }}</td>
                <td>{{ item.active ? "Yes" : "No" }}</td>
              </tr>
              <tr v-if="!recurringAppointments.length">
                <td colspan="5" class="empty-state">
                  No recurring appointments
                </td>
              </tr>
            </tbody>
          </table>
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
@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
}
.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}
.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.grid label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-input {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.report-table th,
.report-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--neutral-200);
}
.report-table th {
  font-size: 12px;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.empty-state {
  text-align: center;
  color: var(--neutral-500);
  padding: 18px;
}
</style>

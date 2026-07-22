<script setup lang="ts">
import { ref, onMounted } from "vue";
import appointmentAPI from "@/services/appointmentAPI";
import logger from "@/utils/logger";

interface Appointment {
  id: number;
  start: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  customer?: { firstName?: string; lastName?: string; phone?: string };
  service?: { name?: string; price?: number };
  station?: { name?: string };
  stylist?: { name?: string };
}

const appointments = ref<Appointment[]>([]);
const loading = ref(true);
const statusOptions = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "status-pending",
    confirmed: "status-confirmed",
    in_progress: "status-in-progress",
    completed: "status-completed",
    cancelled: "status-cancelled",
    no_show: "status-no-show",
  };
  return map[status] || "status-pending";
};

const paymentClass = (paymentStatus: string) => {
  const map: Record<string, string> = {
    deposit: "status-deposit",
    partial: "status-partial",
    paid: "status-paid",
    unpaid: "status-unpaid",
  };
  return map[paymentStatus] || "status-unpaid";
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    const res = await appointmentAPI.getAppointments({ limit: 100 });
    appointments.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load appointments", { error: err });
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (apt: Appointment, status: string) => {
  try {
    await appointmentAPI.updateAppointment(apt.id, { status });
    apt.status = status;
    logger.info("Appointment status updated", { id: apt.id, status });
  } catch (err) {
    logger.error("Failed to update appointment status", { error: err });
  }
};

const deleteAppointment = async (id: number) => {
  if (!confirm("Cancel this appointment?")) return;
  try {
    await appointmentAPI.deleteAppointment(id);
    appointments.value = appointments.value.filter((a) => a.id !== id);
    logger.info("Appointment cancelled", { id });
  } catch (err) {
    logger.error("Failed to cancel appointment", { error: err });
  }
};

onMounted(loadAppointments);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Appointments</h1>
        <p>Manage salon appointments and bookings</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading appointments...</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Date / Time</th>
              <th>Service</th>
              <th>Stylist</th>
              <th>Station</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in appointments" :key="apt.id">
              <td>
                {{ apt.customer?.firstName }} {{ apt.customer?.lastName }}
                <div class="sub-text">{{ apt.customer?.phone }}</div>
              </td>
              <td>{{ formatDate(apt.start) }}</td>
              <td>{{ apt.service?.name || "—" }}</td>
              <td>{{ apt.stylist?.name || "Auto-assign" }}</td>
              <td>{{ apt.station?.name || "—" }}</td>
              <td>
                <select
                  :value="apt.status"
                  :class="['status-select', statusClass(apt.status)]"
                  @change="(e) => updateStatus(apt, (e.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ s.replace("_", " ") }}
                  </option>
                </select>
              </td>
              <td>
                <span
                  :class="['payment-badge', paymentClass(apt.paymentStatus)]"
                >
                  {{ apt.paymentStatus }}
                </span>
              </td>
              <td>
                <button
                  class="btn-danger-sm"
                  @click="deleteAppointment(apt.id)"
                >
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!appointments.length" class="empty-state">
          No appointments found.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
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
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--neutral-600);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.table-container {
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table thead {
  background: var(--neutral-50);
  border-bottom: 1px solid var(--neutral-200);
}
.data-table th {
  text-align: left;
  padding: 14px 16px;
  font-weight: 600;
  color: var(--neutral-700);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--neutral-100);
  color: var(--neutral-900);
}
.sub-text {
  font-size: 12px;
  color: var(--neutral-600);
  margin-top: 2px;
}
.status-select {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: var(--white);
  color: var(--neutral-900);
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}
.status-confirmed {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}
.status-in-progress {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #a5b4fc;
}
.status-completed {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}
.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
.status-no-show {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}
.payment-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}
.status-deposit {
  background: #fef3c7;
  color: #92400e;
}
.status-partial {
  background: #e0e7ff;
  color: #3730a3;
}
.status-paid {
  background: #d1fae5;
  color: #065f46;
}
.status-unpaid {
  background: #fee2e2;
  color: #991b1b;
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
  transition: background 0.2s;
}
.btn-danger-sm:hover {
  background: #fecaca;
}
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--neutral-600);
}
</style>

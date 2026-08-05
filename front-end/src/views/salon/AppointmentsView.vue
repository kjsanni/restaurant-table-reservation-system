<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import appointmentAPI from "@/services/appointmentAPI";
import serviceAPI from "@/services/serviceAPI";
import stationAPI from "@/services/stationAPI";
import locationAPI from "@/services/locationAPI";
import logger from "@/utils/logger";
import { io, Socket } from "socket.io-client";
import { useI18n } from "@/composables/useI18n";

const { t } = useI18n();

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

interface ServiceOption {
  id: number;
  name: string;
  durationMinutes: number;
}

interface StationOption {
  id: number;
  name: string;
}

interface StylistOption {
  id: number;
  username: string;
  email: string;
  skillLevel: string;
}

const appointments = ref<Appointment[]>([]);
const loading = ref(true);
const showForm = ref(false);
const submitting = ref(false);
const generalError = ref("");

const services = ref<ServiceOption[]>([]);
const stations = ref<StationOption[]>([]);
const stylists = ref<StylistOption[]>([]);
const locations = ref<Array<{ id: number; name: string }>>([]);
const selectedLocationId = ref<number | "">("");
const socket = ref<Socket | null>(null);

const statusOptions = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const skillLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    trainee: t("salon.skillLevelTrainee"),
    proficient: t("salon.skillLevelProficient"),
    expert: t("salon.skillLevelExpert"),
  };
  return map[level] || level;
};

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

const form = ref({
  customerFirstName: "",
  customerLastName: "",
  customerPhone: "",
  serviceId: "",
  stationId: "",
  stylistId: "",
  start: "",
  notes: "",
});

const resetForm = () => {
  form.value = {
    customerFirstName: "",
    customerLastName: "",
    customerPhone: "",
    serviceId: "",
    stationId: "",
    stylistId: "",
    start: "",
    notes: "",
  };
  stylists.value = [];
};

const loadOptions = async () => {
  try {
    const [svcRes, stationRes] = await Promise.all([
      serviceAPI.getServices({ limit: 100 }),
      stationAPI.getStations({ limit: 100 }),
    ]);
    services.value = (svcRes.data.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
    }));
    stations.value = (stationRes.data.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
    }));
  } catch (err) {
    logger.error("Failed to load options", { error: err });
  }
};

const loadStylists = async (serviceId: number) => {
  stylists.value = [];
  if (!serviceId) return;
  try {
    const res = await appointmentAPI.getStylistsForService(serviceId);
    stylists.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load stylists", { error: err });
  }
};

const loadLocations = async () => {
  try {
    const res = await locationAPI.getLocations({ limit: 100 });
    locations.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load locations", { error: err });
  }
};

const submitForm = async () => {
  submitting.value = true;
  generalError.value = "";
  try {
    const start = new Date(form.value.start).toISOString();
    const service = services.value.find(
      (s) => s.id === Number(form.value.serviceId)
    );
    const payload: any = {
      customerId: null,
      serviceId: Number(form.value.serviceId),
      stationId: form.value.stationId ? Number(form.value.stationId) : null,
      stylistId: form.value.stylistId ? Number(form.value.stylistId) : null,
      locationId: selectedLocationId.value
        ? Number(selectedLocationId.value)
        : null,
      start,
      durationMinutes: service?.durationMinutes || 30,
      status: "pending",
      paymentStatus: "unpaid",
      depositAmount: 0,
      notes: form.value.notes || null,
      source: "web",
    };

    await appointmentAPI.createAppointment(payload);
    resetForm();
    showForm.value = false;
    await loadAppointments();
  } catch (err) {
    generalError.value =
      err instanceof Error ? err.message : t("salon.failedCreateAppointment");
  } finally {
    submitting.value = false;
  }
};

const loadAppointments = async () => {
  loading.value = true;
  try {
    const res = await appointmentAPI.getAppointments({
      limit: 100,
      ...(selectedLocationId.value
        ? { locationId: selectedLocationId.value }
        : {}),
    });
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
  if (!confirm(t("salon.confirmCancelAppointment"))) return;
  try {
    await appointmentAPI.deleteAppointment(id);
    appointments.value = appointments.value.filter((a) => a.id !== id);
    logger.info("Appointment cancelled", { id });
  } catch (err) {
    logger.error("Failed to cancel appointment", { error: err });
  }
};

const selectedIds = ref<number[]>([]);
const bulkStatus = ref("");

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
};

const toggleSelectAll = () => {
  if (selectedIds.value.length === appointments.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = appointments.value.map((a) => a.id);
  }
};

const bulkUpdateStatus = async () => {
  if (!bulkStatus.value || !selectedIds.value.length) return;
  try {
    await Promise.all(
      selectedIds.value.map((id) =>
        appointmentAPI.updateAppointment(id, { status: bulkStatus.value })
      )
    );
    appointments.value.forEach((apt) => {
      if (selectedIds.value.includes(apt.id)) apt.status = bulkStatus.value;
    });
    selectedIds.value = [];
    bulkStatus.value = "";
  } catch (err) {
    logger.error("Bulk status update failed", { error: err });
  }
};

const bulkCancel = async () => {
  if (!selectedIds.value.length) return;
  if (!confirm(`Cancel ${selectedIds.value.length} appointment(s)?`)) return;
  try {
    await Promise.all(
      selectedIds.value.map((id) => appointmentAPI.deleteAppointment(id))
    );
    appointments.value = appointments.value.filter(
      (a) => !selectedIds.value.includes(a.id)
    );
    selectedIds.value = [];
  } catch (err) {
    logger.error("Bulk cancel failed", { error: err });
  }
};

onMounted(async () => {
  await Promise.all([loadAppointments(), loadLocations()]);
  socket.value = io("", { path: "/socket.io" });
  socket.value.on("salon-appointment-created", async () => {
    await loadAppointments();
  });
  socket.value.on("salon-appointment-updated", async () => {
    await loadAppointments();
  });
  socket.value.on("salon-appointment-deleted", async () => {
    await loadAppointments();
  });
});

onUnmounted(() => {
  socket.value?.disconnect();
  socket.value = null;
});

const openForm = async () => {
  resetForm();
  generalError.value = "";
  await loadOptions();
  showForm.value = true;
};

const handleServiceChange = async () => {
  const serviceId = Number(form.value.serviceId);
  stylists.value = [];
  form.value.stylistId = "";
  if (serviceId) {
    await loadStylists(serviceId);
  }
};
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>{{ t("salon.appointments") }}</h1>
        <p>{{ t("salon.manageAppointments") }}</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="panel-head" style="margin-bottom: 16px">
        <h2>{{ t("salon.appointments") }}</h2>
        <div class="topbar-actions">
          <select
            v-if="locations.length"
            v-model="selectedLocationId"
            class="location-filter"
            @change="loadAppointments"
          >
            <option value="">All Locations</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
          <button class="btn-primary" @click="openForm">
            {{ t("salon.newAppointment") }}
          </button>
        </div>
      </div>

      <div v-if="showForm" class="form-panel">
        <h3>{{ t("salon.newAppointment") }}</h3>
        <div class="form-grid">
          <div class="field">
            <label for="customerFirstName">{{ t("salon.firstName") }}</label>
            <input id="customerFirstName" v-model="form.customerFirstName" />
          </div>
          <div class="field">
            <label for="customerLastName">{{ t("salon.lastName") }}</label>
            <input id="customerLastName" v-model="form.customerLastName" />
          </div>
          <div class="field">
            <label for="customerPhone">{{ t("salon.phone") }}</label>
            <input id="customerPhone" v-model="form.customerPhone" />
          </div>
          <div class="field">
            <label for="service">{{ t("salon.service") }}</label>
            <select
              id="service"
              v-model="form.serviceId"
              @change="handleServiceChange"
            >
              <option value="">{{ t("salon.selectService") }}</option>
              <option
                v-for="svc in services"
                :key="svc.id"
                :value="String(svc.id)"
              >
                {{ svc.name }} ({{ svc.durationMinutes }}m)
              </option>
            </select>
          </div>
          <div class="field">
            <label for="stylist">{{ t("salon.stylist") }}</label>
            <select
              id="stylist"
              v-model="form.stylistId"
              :disabled="!stylists.length"
            >
              <option value="">{{ t("salon.autoAssign") }}</option>
              <option
                v-for="stylist in stylists"
                :key="stylist.id"
                :value="String(stylist.id)"
              >
                {{ stylist.username }} —
                {{ skillLevelLabel(stylist.skillLevel) }}
              </option>
            </select>
            <div v-if="!stylists.length && form.serviceId" class="field-hint">
              {{ t("salon.noStylistsMapped") }}
            </div>
          </div>
          <div class="field">
            <label for="station">{{ t("salon.station") }}</label>
            <select id="station" v-model="form.stationId">
              <option value="">{{ t("salon.unassigned") }}</option>
              <option
                v-for="station in stations"
                :key="station.id"
                :value="String(station.id)"
              >
                {{ station.name }}
              </option>
            </select>
          </div>
          <div v-if="locations.length" class="field">
            <label for="location">Location</label>
            <select id="location" v-model="selectedLocationId">
              <option value="">{{ t("salon.unassigned") }}</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label for="start">{{ t("salon.start") }}</label>
            <input id="start" type="datetime-local" v-model="form.start" />
          </div>
          <div class="field full">
            <label for="notes">{{ t("salon.notes") }}</label>
            <textarea id="notes" v-model="form.notes" rows="3" />
          </div>
        </div>
        <div v-if="generalError" class="error-msg">{{ generalError }}</div>
        <div class="form-actions">
          <button
            class="btn-secondary"
            :disabled="submitting"
            @click="showForm = false"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            class="btn-primary"
            :disabled="submitting"
            @click="submitForm"
          >
            <span v-if="!submitting">{{ t("salon.create") }}</span>
            <span v-else>{{ t("common.saving") }}</span>
          </button>
        </div>
      </div>

      <div v-if="selectedIds.length" class="bulk-bar">
        <span class="bulk-count"
          >{{ selectedIds.length }} {{ t("salon.selected") }}</span
        >
        <select v-model="bulkStatus" class="bulk-select">
          <option value="">{{ t("salon.updateStatus") }}</option>
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ s.replace("_", " ") }}
          </option>
        </select>
        <button
          class="btn-primary"
          :disabled="!bulkStatus"
          @click="bulkUpdateStatus"
        >
          {{ t("salon.apply") }}
        </button>
        <button class="btn-danger-sm" @click="bulkCancel">
          {{ t("salon.cancelSelected") }}
        </button>
        <button class="btn-secondary" @click="selectedIds = []">
          {{ t("salon.clear") }}
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t("salon.loadingAppointments") }}</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="checkbox-cell">
                <input
                  type="checkbox"
                  :checked="
                    selectedIds.length === appointments.length &&
                    appointments.length > 0
                  "
                  @change="toggleSelectAll"
                />
              </th>
              <th>{{ t("salon.client") }}</th>
              <th>{{ t("salon.dateTime") }}</th>
              <th>{{ t("salon.service") }}</th>
              <th>{{ t("salon.stylist") }}</th>
              <th>{{ t("salon.station") }}</th>
              <th>{{ t("common.status") }}</th>
              <th>{{ t("salon.payment") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in appointments" :key="apt.id">
              <td class="checkbox-cell">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(apt.id)"
                  @change="toggleSelect(apt.id)"
                />
              </td>
              <td>
                {{ apt.customer?.firstName }} {{ apt.customer?.lastName }}
                <div class="sub-text">{{ apt.customer?.phone }}</div>
              </td>
              <td>{{ formatDate(apt.start) }}</td>
              <td>{{ apt.service?.name || "—" }}</td>
              <td>{{ apt.stylist?.name || t("salon.autoAssign") }}</td>
              <td>{{ apt.station?.name || "—" }}</td>
              <td>
                <select
                  :value="apt.status"
                  :class="['status-select', statusClass(apt.status)]"
                  @change="
                    (e) =>
                      updateStatus(apt, (e.target as HTMLSelectElement).value)
                  "
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
                  {{ t("common.cancel") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!appointments.length" class="empty-state">
          {{ t("salon.noAppointments") }}
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
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.topbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.location-filter {
  padding: 6px 10px;
  border: 1px solid var(--border, #e5e5e5);
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
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

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-head h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
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

.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-900);
  border: 1px solid var(--neutral-200);
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
}

.form-panel {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
  margin-bottom: 18px;
}

.form-panel h4 {
  margin: 0 0 14px;
  font-family: var(--font-serif);
  font-size: 16px;
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

.field.full {
  grid-column: span 3;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-700);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field input,
.field select,
.field textarea {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 10px 12px;
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  width: 100%;
}

.field-hint {
  font-size: 12px;
  color: var(--neutral-600);
}

.error-msg {
  margin-top: 12px;
  color: #b91c1c;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.bulk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
}
.bulk-count {
  font-weight: 700;
  font-size: 13px;
  color: var(--neutral-900);
}
.bulk-select {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  font-size: 13px;
  background: var(--white);
  color: var(--neutral-900);
}
.checkbox-cell {
  width: 40px;
  text-align: center;
}
</style>

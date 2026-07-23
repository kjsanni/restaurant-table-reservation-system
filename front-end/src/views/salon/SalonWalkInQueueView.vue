<script setup lang="ts">
import { ref, onMounted } from "vue";
import appointmentAPI from "@/services/appointmentAPI";
import serviceAPI from "@/services/serviceAPI";
import stationAPI from "@/services/stationAPI";
import customerAPI from "@/services/customerAPI";
import logger from "@/utils/logger";

interface Appointment {
  id: number;
  start: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
  source: string;
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

const walkins = ref<Appointment[]>([]);
const loading = ref(true);
const showForm = ref(false);
const submitting = ref(false);
const generalError = ref("");

const services = ref<ServiceOption[]>([]);
const stations = ref<StationOption[]>([]);
const stylists = ref<StylistOption[]>([]);

const statusOptions = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const columns = [
  { key: "pending", label: "Waiting" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "no_show", label: "No-show" },
];

const skillLevelLabel = (level: string) => {
  const map: Record<string, string> = {
    trainee: "Trainee",
    proficient: "Proficient",
    expert: "Expert",
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

const formatTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const form = ref({
  customerId: null as number | null,
  customerSearch: "",
  serviceId: "",
  stationId: "",
  stylistId: "",
  notes: "",
});

const customerResults = ref<{ id: number; firstName?: string; lastName?: string; phone?: string; email?: string }[]>([]);
const selectedCustomerName = ref("");

const resetForm = () => {
  form.value = {
    customerId: null,
    customerSearch: "",
    serviceId: "",
    stationId: "",
    stylistId: "",
    notes: "",
  };
  customerResults.value = [];
  selectedCustomerName.value = "";
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

const searchCustomers = async () => {
  const query = form.value.customerSearch?.trim();
  if (!query) {
    customerResults.value = [];
    return;
  }
  try {
    const res = await customerAPI.search(query);
    customerResults.value = res.data.data || res.data || [];
  } catch (err) {
    logger.error("Failed to search customers", { error: err });
  }
};

const selectCustomer = (customer: { id: number; firstName?: string; lastName?: string }) => {
  form.value.customerId = customer.id;
  selectedCustomerName.value = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || `Customer #${customer.id}`;
  customerResults.value = [];
};

const clearCustomer = () => {
  form.value.customerId = null;
  selectedCustomerName.value = "";
  form.value.customerSearch = "";
  customerResults.value = [];
};

const handleServiceChange = async () => {
  const serviceId = Number(form.value.serviceId);
  stylists.value = [];
  form.value.stylistId = "";
  if (serviceId) {
    await loadStylists(serviceId);
  }
};

const submitForm = async () => {
  submitting.value = true;
  generalError.value = "";
  try {
    const service = services.value.find((s) => s.id === Number(form.value.serviceId));
    const payload: any = {
      customerId: form.value.customerId,
      serviceId: Number(form.value.serviceId),
      stationId: form.value.stationId ? Number(form.value.stationId) : null,
      stylistId: form.value.stylistId ? Number(form.value.stylistId) : null,
      start: new Date().toISOString(),
      durationMinutes: service?.durationMinutes || 30,
      status: "pending",
      paymentStatus: "unpaid",
      depositAmount: 0,
      notes: form.value.notes || null,
      source: "walkin",
    };

    await appointmentAPI.createAppointment(payload);
    resetForm();
    showForm.value = false;
    await loadWalkins();
  } catch (err) {
    generalError.value = err instanceof Error ? err.message : "Failed to add walk-in";
  } finally {
    submitting.value = false;
  }
};

const loadWalkins = async () => {
  loading.value = true;
  try {
    const res = await appointmentAPI.getAppointments({ source: "walkin", limit: 100 });
    walkins.value = res.data.data || [];
  } catch (err) {
    logger.error("Failed to load walk-ins", { error: err });
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (apt: Appointment, status: string) => {
  try {
    await appointmentAPI.updateAppointment(apt.id, { status });
    apt.status = status;
    logger.info("Walk-in status updated", { id: apt.id, status });
  } catch (err) {
    logger.error("Failed to update walk-in status", { error: err });
  }
};

const removeWalkin = async (id: number) => {
  if (!confirm("Remove this walk-in from the queue?")) return;
  try {
    await appointmentAPI.deleteAppointment(id);
    walkins.value = walkins.value.filter((w) => w.id !== id);
  } catch (err) {
    logger.error("Failed to remove walk-in", { error: err });
  }
};

const openForm = async () => {
  resetForm();
  generalError.value = "";
  await loadOptions();
  showForm.value = true;
};

onMounted(async () => {
  await loadWalkins();
});
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>Walk-in Queue</h1>
        <p>Manage salon walk-in appointments</p>
      </div>
      <div class="topbar-right">
        <button class="btn-primary" @click="openForm">+ Add Walk-in</button>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="showForm" class="form-panel">
        <h3>New Walk-in</h3>
        <div class="form-grid">
          <div class="field full">
            <label for="customerSearch">Customer</label>
            <input
              id="customerSearch"
              v-model="form.customerSearch"
              placeholder="Search existing customers by name, phone, or email"
              autocomplete="off"
              @input="searchCustomers"
            />
            <div v-if="selectedCustomerName" class="field-hint">
              Selected: {{ selectedCustomerName }}
              <button class="link-clear" type="button" @click="clearCustomer">Clear</button>
            </div>
            <div v-if="customerResults.length" class="customer-results">
              <button
                v-for="customer in customerResults"
                :key="customer.id"
                type="button"
                class="customer-option"
                @click="selectCustomer(customer)"
              >
                <b>{{ customer.firstName }} {{ customer.lastName }}</b>
                <span>{{ customer.phone || customer.email }}</span>
              </button>
            </div>
          </div>
          <div class="field">
            <label for="service">Service</label>
            <select id="service" v-model="form.serviceId" @change="handleServiceChange">
              <option value="">Select service</option>
              <option v-for="svc in services" :key="svc.id" :value="String(svc.id)">
                {{ svc.name }} ({{ svc.durationMinutes }}m)
              </option>
            </select>
          </div>
          <div class="field">
            <label for="stylist">Stylist</label>
            <select id="stylist" v-model="form.stylistId" :disabled="!stylists.length">
              <option value="">Auto-assign</option>
              <option v-for="stylist in stylists" :key="stylist.id" :value="String(stylist.id)">
                {{ stylist.username }} — {{ skillLevelLabel(stylist.skillLevel) }}
              </option>
            </select>
            <div v-if="!stylists.length && form.serviceId" class="field-hint">No stylists mapped for this service.</div>
          </div>
          <div class="field">
            <label for="station">Station</label>
            <select id="station" v-model="form.stationId">
              <option value="">Unassigned</option>
              <option v-for="station in stations" :key="station.id" :value="String(station.id)">
                {{ station.name }}
              </option>
            </select>
          </div>
          <div class="field full">
            <label for="notes">Notes</label>
            <textarea id="notes" v-model="form.notes" rows="3" />
          </div>
        </div>
        <div v-if="generalError" class="error-msg">{{ generalError }}</div>
        <div class="form-actions">
          <button class="btn-secondary" :disabled="submitting" @click="showForm = false">Cancel</button>
          <button class="btn-primary" :disabled="submitting" @click="submitForm">
            <span v-if="!submitting">Add to Queue</span>
            <span v-else>Saving...</span>
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading queue...</p>
      </div>

      <div v-else class="queue-board">
        <div v-for="column in columns" :key="column.key" class="queue-column">
          <div class="column-header">
            <h3>{{ column.label }}</h3>
            <span class="column-count">{{ walkins.filter((w) => w.status === column.key).length }}</span>
          </div>
          <div class="column-body">
            <div
              v-for="apt in walkins.filter((w) => w.status === column.key)"
              :key="apt.id"
              :class="['queue-card', statusClass(apt.status)]"
            >
              <div class="card-header">
                <b>{{ apt.service?.name || 'Service' }}</b>
                <span class="card-time">{{ formatTime(apt.start) }}</span>
              </div>
              <div class="card-body">
                <div class="card-client">
                  {{ apt.customer?.firstName || 'Guest' }} {{ apt.customer?.lastName || '' }}
                </div>
                <div class="card-meta">
                  {{ apt.stylist?.name || 'Unassigned' }} · {{ apt.station?.name || 'Unassigned' }}
                </div>
                <div class="card-duration">{{ apt.durationMinutes }}m</div>
              </div>
              <div class="card-actions">
                <select
                  :value="apt.status"
                  :class="['status-select', statusClass(apt.status)]"
                  @change="(e) => updateStatus(apt, (e.target as HTMLSelectElement).value)"
                >
                  <option v-for="s in statusOptions" :key="s" :value="s">
                    {{ s.replace("_", " ") }}
                  </option>
                </select>
                <button class="btn-danger-sm" @click="removeWalkin(apt.id)">Remove</button>
              </div>
            </div>
            <div v-if="!walkins.filter((w) => w.status === column.key).length" class="empty-cell">
              —
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
.topbar-right {
  display: flex;
  gap: 12px;
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
  to { transform: rotate(360deg); }
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
.form-panel h3 {
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
.customer-results {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: var(--white);
  margin-top: 6px;
  overflow: hidden;
}
.customer-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-bottom: 1px solid var(--neutral-100);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  color: var(--neutral-900);
}
.customer-option:last-child {
  border-bottom: none;
}
.customer-option:hover {
  background: var(--neutral-50);
}
.customer-option b {
  font-weight: 600;
}
.customer-option span {
  font-size: 12px;
  color: var(--neutral-600);
}
.link-clear {
  background: transparent;
  border: none;
  color: var(--brand-600);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
}
.error-msg {
  margin-top: 10px;
  color: #b91c1c;
  font-size: 13px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}
.queue-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.queue-column {
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
  padding: 14px 16px;
  border-bottom: 1px solid var(--neutral-200);
}
.column-header h3 {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--neutral-900);
}
.column-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-600);
  background: var(--neutral-100);
  padding: 2px 8px;
  border-radius: 999px;
}
.column-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
}
.queue-card {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 12px;
  background: var(--white);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.card-header b {
  font-size: 13px;
  color: var(--neutral-900);
}
.card-time {
  font-size: 11px;
  color: var(--neutral-600);
  font-weight: 700;
}
.card-body {
  font-size: 13px;
  color: var(--neutral-700);
}
.card-client {
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 2px;
}
.card-meta {
  font-size: 12px;
  color: var(--neutral-600);
  margin-bottom: 4px;
}
.card-duration {
  font-size: 12px;
  color: var(--neutral-600);
}
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
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
.btn-secondary {
  background: var(--neutral-100);
  color: var(--neutral-900);
  border: 1px solid var(--neutral-200);
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  font-weight: 600;
  cursor: pointer;
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
  font-size: 13px;
  padding: 24px 0;
}

@media (max-width: 1100px) {
  .queue-board {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .queue-board {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="commissions-view">
    <div class="page-header">
      <div>
        <h1>{{ t("salon.commissionsTitle", "Commissions") }}</h1>
        <p class="subtitle">
          {{
            t(
              "salon.commissionsSubtitle",
              "Track and manage stylist commissions"
            )
          }}
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openCreateForm" :disabled="loading">
          {{ t("salon.newCommission") }}
        </button>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">{{ t("salon.pendingCommissions") }}</div>
        <div class="card-value warning">{{ formatMoney(pendingTotal) }}</div>
      </div>
      <div class="card">
        <div class="card-label">{{ t("salon.paidCommissions") }}</div>
        <div class="card-value success">{{ formatMoney(paidTotal) }}</div>
      </div>
      <div class="card">
        <div class="card-label">{{ t("salon.totalCommissions") }}</div>
        <div class="card-value">{{ formatMoney(grandTotal) }}</div>
      </div>
    </div>

    <div v-if="locations.length" class="location-filter-bar">
      <label>{{ t("salon.location", "Location") }}</label>
      <select
        v-model="selectedLocationId"
        class="field-input"
        @change="loadData"
      >
        <option value="">{{ t("salon.allLocations", "All locations") }}</option>
        <option v-for="loc in locations" :key="loc.id" :value="loc.id">
          {{ loc.name }}
        </option>
      </select>
    </div>

    <div v-if="showForm" class="form-panel">
      <h3>
        {{
          editingId ? t("salon.updateCommission") : t("salon.createCommission")
        }}
      </h3>
      <div class="form-grid">
        <div class="field">
          <label for="stylist">{{ t("salon.stylist") }}</label>
          <select id="stylist" v-model="form.userId" :disabled="!!editingId">
            <option value="">{{ t("salon.selectStylist") }}</option>
            <option v-for="s in stylists" :key="s.id" :value="String(s.id)">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="service">{{ t("salon.service") }}</label>
          <select id="service" v-model="form.serviceId">
            <option value="">{{ t("salon.selectService") }}</option>
            <option v-for="s in services" :key="s.id" :value="String(s.id)">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="location">{{ t("salon.location", "Location") }}</label>
          <select id="location" v-model="form.locationId">
            <option value="">
              {{ t("salon.selectLocation", "Select location") }}
            </option>
            <option
              v-for="loc in locations"
              :key="loc.id"
              :value="String(loc.id)"
            >
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="rateType">{{ t("salon.rateType") }}</label>
          <select id="rateType" v-model="form.rateType">
            <option value="percentage">{{ t("salon.percentage") }}</option>
            <option value="fixed">{{ t("salon.fixedAmount") }}</option>
          </select>
        </div>
        <div class="field">
          <label for="rateValue">{{ t("salon.rateValue") }}</label>
          <input id="rateValue" type="number" v-model="form.rateValue" />
        </div>
        <div class="field">
          <label for="amount">{{ t("salon.amount") }}</label>
          <input id="amount" type="number" v-model="form.amount" />
        </div>
        <div class="field">
          <label for="status">{{ t("common.status") }}</label>
          <select id="status" v-model="form.status" :disabled="!editingId">
            <option value="pending">{{ t("salon.pending") }}</option>
            <option value="paid">{{ t("salon.paid") }}</option>
            <option value="cancelled">{{ t("salon.cancelled") }}</option>
          </select>
        </div>
        <div class="field full">
          <label for="notes">{{ t("common.notes") }}</label>
          <textarea id="notes" v-model="form.notes" rows="2" />
        </div>
      </div>
      <div v-if="generalError" class="error-msg">{{ generalError }}</div>
      <div class="form-actions">
        <button class="btn-secondary" @click="closeForm" :disabled="submitting">
          {{ t("common.cancel") }}
        </button>
        <button class="btn-primary" @click="submitForm" :disabled="submitting">
          <span v-if="!submitting">{{
            editingId ? t("common.save") : t("salon.create")
          }}</span>
          <span v-else>{{ t("common.saving") }}</span>
        </button>
      </div>
    </div>

    <div class="card" style="margin-top: var(--space-5)">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="items.length === 0" class="empty-state">
        {{ t("salon.noCommissions") }}
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t("salon.stylist") }}</th>
              <th>{{ t("salon.service") }}</th>
              <th>{{ t("salon.rateType") }}</th>
              <th>{{ t("salon.rateValue") }}</th>
              <th>{{ t("salon.amount") }}</th>
              <th>{{ t("common.status") }}</th>
              <th>{{ t("common.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id">
              <td>{{ c.stylist?.name || "—" }}</td>
              <td>{{ c.service?.name || "—" }}</td>
              <td>{{ c.rateType }}</td>
              <td>
                {{ c.rateValue }}{{ c.rateType === "percentage" ? "%" : "" }}
              </td>
              <td>{{ formatMoney(c.amount) }}</td>
              <td>
                <span class="badge" :class="'badge-' + c.status">
                  {{ c.status }}
                </span>
              </td>
              <td>
                <button
                  v-if="c.status === 'pending'"
                  class="btn-sm"
                  @click="markPaid(c)"
                >
                  {{ t("salon.markPaid") }}
                </button>
                <button class="btn-sm btn-secondary" @click="editCommission(c)">
                  {{ t("common.edit") }}
                </button>
                <button
                  class="btn-sm btn-danger"
                  @click="deleteCommission(c.id)"
                >
                  {{ t("common.delete") }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import commissionAPI from "@/services/commissionAPI";
import { useI18n } from "@/composables/useI18n";
import serviceAPI from "@/services/serviceAPI";
import authAPI from "@/services/authAPI";
import locationAPI from "@/services/locationAPI";

const { t } = useI18n();

const loading = ref(false);
const submitting = ref(false);
const items = ref<
  Array<{
    id: number;
    userId: number;
    serviceId?: number;
    rateType: string;
    rateValue: number;
    amount: number;
    status: string;
    notes?: string;
    locationId?: number | null;
    stylist?: { id: number; username: string };
    service?: { id: number; name: string };
  }>
>([]);
const stylists = ref([]);
const services = ref([]);
const locations = ref<Array<{ id: number; name: string }>>([]);
const selectedLocationId = ref<number | "">("");
const editingId = ref<number | null>(null);
const generalError = ref("");

const showForm = ref(false);

const form = ref({
  userId: "",
  serviceId: "",
  rateType: "percentage",
  rateValue: 0,
  amount: 0,
  status: "pending",
  notes: "",
  locationId: null,
});

const pendingTotal = computed(() =>
  items.value
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount), 0)
);
const paidTotal = computed(() =>
  items.value
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount), 0)
);
const grandTotal = computed(() =>
  items.value.reduce((sum, c) => sum + Number(c.amount), 0)
);

const formatMoney = (val: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(val || 0);
};

const loadData = async () => {
  loading.value = true;
  try {
    const params: any = { limit: 100 };
    if (selectedLocationId.value) {
      params.locationId = selectedLocationId.value;
    }
    const [commissionsRes, stylistsRes, servicesRes] = await Promise.all([
      commissionAPI.getCommissions(params),
      authAPI.getUsers({ limit: 100 }),
      serviceAPI.getServices({ limit: 100 }),
    ]);
    items.value = commissionsRes.data?.data || [];
    stylists.value = stylistsRes.data?.data || stylistsRes.data || [];
    services.value = servicesRes.data?.data || [];
  } catch (err) {
    generalError.value =
      err instanceof Error ? err.message : "Failed to load commissions";
  } finally {
    loading.value = false;
  }
};

const loadLocations = async () => {
  try {
    const res = await locationAPI.list();
    locations.value = res.data.data || [];
  } catch (err) {
    console.error("Failed to load locations", err);
  }
};

const openCreateForm = () => {
  editingId.value = null;
  form.value = {
    userId: "",
    serviceId: "",
    rateType: "percentage",
    rateValue: 0,
    amount: 0,
    status: "pending",
    notes: "",
    locationId: null,
  };
  showForm.value = true;
};

const editCommission = (c) => {
  editingId.value = c.id;
  form.value = {
    userId: String(c.userId),
    serviceId: c.serviceId ? String(c.serviceId) : "",
    rateType: c.rateType,
    rateValue: Number(c.rateValue),
    amount: Number(c.amount),
    status: c.status,
    notes: c.notes || "",
    locationId: c.locationId || null,
  };
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingId.value = null;
  generalError.value = "";
};

const submitForm = async () => {
  submitting.value = true;
  generalError.value = "";
  try {
    const payload = {
      ...form.value,
      userId: Number(form.value.userId),
      serviceId: form.value.serviceId ? Number(form.value.serviceId) : null,
      rateValue: Number(form.value.rateValue),
      amount: Number(form.value.amount),
    };
    if (editingId.value) {
      await commissionAPI.updateCommission(editingId.value, payload);
    } else {
      await commissionAPI.createCommission(payload);
    }
    closeForm();
    await loadData();
  } catch (err) {
    generalError.value =
      err instanceof Error ? err.message : "Failed to save commission";
  } finally {
    submitting.value = false;
  }
};

const markPaid = async (c) => {
  try {
    await commissionAPI.markCommissionPaid(c.id);
    await loadData();
  } catch (err) {
    generalError.value =
      err instanceof Error ? err.message : "Failed to mark commission as paid";
  }
};

const deleteCommission = async (id: number) => {
  if (!confirm(t("salon.confirmDeleteCommission"))) return;
  try {
    await commissionAPI.deleteCommission(id);
    await loadData();
  } catch (err) {
    generalError.value =
      err instanceof Error ? err.message : "Failed to delete commission";
  }
};

onMounted(async () => {
  await loadLocations();
  await loadData();
});
</script>

<style scoped>
.commissions-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.page-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card-label {
  font-size: var(--text-xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.card-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-2);
}
.card-value.success {
  color: var(--earth-700);
}
.card-value.warning {
  color: var(--amber-700);
}
.form-panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
.field.full {
  grid-column: 1 / -1;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-10);
}
.spinner-sm {
  width: 24px;
  height: 24px;
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
.empty-state {
  text-align: center;
  padding: var(--space-10) var(--space-6);
  color: var(--ink-muted);
}
.table-wrap {
  overflow-x: auto;
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
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}
.badge-paid {
  background: var(--earth-100);
  color: var(--earth-700);
}
.badge-pending {
  background: var(--amber-100);
  color: var(--amber-700);
}
.badge-cancelled {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.btn-sm {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  margin-right: var(--space-1);
}
.btn-sm:hover {
  background: var(--neutral-50);
}
.btn-danger {
  background: var(--rose-50);
  color: var(--rose-700);
  border-color: var(--rose-200);
}
.btn-danger:hover {
  background: var(--rose-100);
}
.error-msg {
  color: var(--rose-700);
  margin-top: var(--space-3);
}
</style>

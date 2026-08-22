<template>
  <div class="tenant-dashboard">
    <div class="dashboard-header">
      <h1>Venue Platform Admin</h1>
      <p class="subtitle">
        Manage venues, plans, and billing across the platform
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div
        class="skeleton skeleton-card"
        style="width: 100%; height: 120px; margin-bottom: var(--space-4)"
      ></div>
      <div
        class="skeleton skeleton-card"
        style="width: 100%; height: 120px; margin-bottom: var(--space-4)"
      ></div>
      <div
        class="skeleton skeleton-card"
        style="width: 100%; height: 120px"
      ></div>
    </div>

    <div v-else class="summary-cards">
      <div class="card">
        <div class="card-label">Total Venues</div>
        <div class="card-value">{{ dashboard?.total }}</div>
      </div>
      <div class="card">
        <div class="card-label">Active</div>
        <div class="card-value success">{{ dashboard?.active }}</div>
      </div>
      <div class="card">
        <div class="card-label">Inactive</div>
        <div class="card-value muted">
          {{
            dashboard?.inactive ||
            dashboard?.suspended + dashboard?.cancelled + dashboard?.trialing
          }}
        </div>
      </div>
      <div class="card">
        <div class="card-label">Past Due</div>
        <div class="card-value warning">{{ dashboard?.pastDue }}</div>
      </div>
      <div class="card">
        <div class="card-label">Suspended</div>
        <div class="card-value danger">{{ dashboard?.suspended }}</div>
      </div>
      <div class="card">
        <div class="card-label">Venue Revenue (GHS)</div>
        <div class="card-value">{{ formatMrr(dashboard?.mrr) }}</div>
      </div>
      <div class="card">
        <div class="card-label">ERPNext Tenants</div>
        <div class="card-value info">{{ dashboard?.erpnextEnabledCount }}</div>
      </div>
    </div>

    <div class="quick-actions">
      <button @click="goTo('/super-admin/tenants')" class="qa-card">
        <Icon icon="mdi:office-building" width="28" height="28" />
        <span class="qa-text">Tenants</span>
      </button>
      <button @click="goTo('/super-admin/tenants?view=plans')" class="qa-card">
        <Icon icon="mdi:currency-usd" width="28" height="28" />
        <span class="qa-text">Pricing</span>
      </button>
      <button @click="goTo('/super-admin/payments')" class="qa-card">
        <Icon icon="mdi:credit-card" width="28" height="28" />
        <span class="qa-text">Payments</span>
      </button>
    </div>

    <div class="filters">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          placeholder="Search venues..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="search-input-clear"
          aria-label="Clear search"
        >
          ×
        </button>
      </div>
      <select v-model="filterStatus" class="filter-select">
        <option value="active" selected>Active</option>
        <option value="past_due">Past Due</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="trialing">Trialing</option>
      </select>
      <select v-model="filterProvisioning" class="filter-select">
        <option value="">All Provisioning</option>
        <option value="running">Running</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="rolled_back">Rolled Back</option>
      </select>
      <button @click="openCreateModal" class="btn-primary">+ Add Venue</button>
    </div>

    <div v-if="selectedTenants.length > 0" class="bulk-actions">
      <span class="bulk-count">{{ selectedTenants.length }} selected</span>
      <button @click="openVerticalModal" class="btn-secondary">
        Change Vertical
      </button>
      <button @click="bulkProvision" class="btn-secondary">
        Run Provisioning
      </button>
      <button @click="clearSelection" class="btn-secondary">Clear</button>
    </div>

    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="modal">
        <h2>Create New Venue</h2>
        <div class="wizard-steps">
          <div
            v-for="step in wizardSteps"
            :key="step.key"
            class="wizard-step"
            :class="{
              active: wizardStep === step.key,
              completed: wizardStep > step.key,
            }"
          >
            <div class="wizard-step-number">{{ step.key }}</div>
            <div class="wizard-step-label">{{ step.label }}</div>
          </div>
        </div>

        <form @submit.prevent="createTenant">
          <div v-if="wizardStep === 1" class="wizard-panel">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="form.name" required />
            </div>
            <div class="form-group">
              <label>Slug *</label>
              <div class="slug-row">
                <input v-model="form.slug" required />
                <button
                  type="button"
                  class="btn-secondary"
                  @click="form.slug = generateSlug(form.name)"
                  :disabled="!form.name"
                >
                  Generate
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Domain</label>
              <input v-model="form.domain" />
            </div>
          </div>

          <div v-if="wizardStep === 2" class="wizard-panel">
            <div class="form-group">
              <label>Business Vertical</label>
              <select v-model="form.businessVertical">
                <option value="restaurant">Restaurant</option>
                <option value="salon">Salon</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ venueTypeLabel }}</label>
              <select v-model="form.restaurantType">
                <option
                  v-for="type in venueTypeOptions"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="wizardStep === 3" class="wizard-panel">
            <div class="form-group">
              <label>Plan</label>
              <select v-model="form.plan">
                <option
                  v-for="plan in plans"
                  :key="plan.slug"
                  :value="plan.slug"
                >
                  {{ plan.name }} — {{ plan.currency }} {{ plan.price }} / mo
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select v-model="form.currency">
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div class="form-group">
              <label>Billing Email</label>
              <input v-model="form.billingEmail" />
            </div>
            <div class="form-group">
              <label>Billing Name</label>
              <input v-model="form.billingName" />
            </div>
          </div>

          <div class="wizard-actions">
            <button
              type="button"
              @click="closeCreateModal"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              v-if="wizardStep > 1"
              type="button"
              class="btn-secondary"
              @click="wizardStep -= 1"
            >
              Back
            </button>
            <button
              v-if="wizardStep < 3"
              type="button"
              class="btn-primary"
              @click="wizardStep += 1"
            >
              Next
            </button>
            <button v-if="wizardStep === 3" type="submit" class="btn-primary">
              Create Venue
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showVerticalModal"
      class="modal-overlay"
      @click.self="closeVerticalModal"
    >
      <div class="modal">
        <h2>Change Business Vertical</h2>
        <p class="modal-hint">
          Update {{ selectedTenants.length }} venue(s) to a new business
          vertical.
        </p>
        <form @submit.prevent="changeVertical">
          <div class="form-group">
            <label>Business Vertical *</label>
            <select v-model="verticalForm.businessVertical" required>
              <option value="restaurant">Restaurant</option>
              <option value="salon">Salon</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeVerticalModal"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Update Vertical</button>
          </div>
        </form>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="tenant-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>Name</th>
            <th>Slug</th>
            <th>Plan</th>
            <th>ERPNext</th>
            <th>Vertical</th>
            <th>Status</th>
            <th>Provisioning</th>
            <th>Subscription</th>
            <th>Next Billing</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredTenants.length">
            <td colspan="8">
              <div class="empty-state">
                <p>No venues found</p>
                <button @click="openCreateModal" class="btn-primary">
                  + Add Venue
                </button>
              </div>
            </td>
          </tr>
          <tr v-for="tenant in filteredTenants" :key="tenant.id">
            <td>
              <input
                type="checkbox"
                :value="tenant.id"
                v-model="selectedTenants"
              />
            </td>
            <td>{{ tenant.name }}</td>
            <td>{{ tenant.slug }}</td>
            <td>{{ tenant.plan }}</td>
            <td>
              <span v-if="tenant.erpnextModules?.length" class="erpnext-badge">
                {{ tenant.erpnextModules.join(", ") }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ tenant.businessVertical || "—" }}</td>
            <td>
              <span :class="['status-badge', tenant.status]">{{
                tenant.status
              }}</span>
            </td>
            <td>
              <span
                :class="[
                  'provisioning-badge',
                  provisioningStatuses[tenant.id] || 'unknown',
                ]"
              >
                {{ provisioningStatuses[tenant.id] || "—" }}
              </span>
            </td>
            <td>{{ tenant.subscriptionStatus }}</td>
            <td>{{ formatDate(tenant.currentPeriodEnd) }}</td>
            <td class="actions">
              <button @click="accessTenant(tenant)" class="btn-small success">
                Access
              </button>
              <button @click="viewTenant(tenant.id)" class="btn-small">
                View
              </button>
              <button
                v-if="
                  tenant.status === 'suspended' || tenant.status === 'past_due'
                "
                @click="enableTenant(tenant.id)"
                class="btn-small success"
              >
                Enable
              </button>
              <button
                v-if="
                  tenant.status === 'active' || tenant.status === 'past_due'
                "
                @click="disableTenant(tenant.id)"
                class="btn-small danger"
              >
                Disable
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="totalPages > 1"
        :current-page="tenantsPage"
        :total-pages="totalPages"
        @update:page="tenantsPage = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, computed, onMounted, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import planAPI from "@/services/planAPI";
import { useAuthStore } from "@/stores/auth";
import { generateSlug } from "@/utils/slug";
import Pagination from "@/components/AdminPagination.vue";

let toastStore = null;
try {
  toastStore = useToastStore();
} catch {
  toastStore = null;
}

const router = useRouter();
const authStore = useAuthStore();
const dashboard = ref({
  total: 0,
  active: 0,
  pastDue: 0,
  suspended: 0,
  cancelled: 0,
  trialing: 0,
  mrr: 0,
  recentTenants: [],
});
const tenants = ref([]);
const tenantsTotal = ref(0);
const tenantsPage = ref(1);
const tenantsPageSize = ref(20);
const provisioningStatuses = ref({});
const plans = ref([]);
const searchQuery = ref("");
const filterStatus = ref("active");
const filterProvisioning = ref("");
const selectedTenants = ref([]);
const loading = ref(false);
const showVerticalModal = ref(false);
const verticalForm = ref({
  businessVertical: "restaurant",
});
const showCreateModal = ref(false);
const wizardStep = ref(1);
const form = ref({
  name: "",
  slug: "",
  domain: "",
  plan: "starter",
  billingEmail: "",
  billingName: "",
  currency: "GHS",
  businessVertical: "restaurant",
  restaurantType: "full_service",
});

const wizardSteps = [
  { key: 1, label: "Identity" },
  { key: 2, label: "Configuration" },
  { key: 3, label: "Billing" },
];

const RESTAURANT_TYPES = [
  { value: "full_service", label: "Full Service Restaurant" },
  { value: "quick_service", label: "Quick Service" },
  { value: "cloud_kitchen", label: "Cloud Kitchen" },
  { value: "dine_in_only", label: "Dine-In Only" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar / Lounge" },
];

const SALON_TYPES = [
  { value: "hair-dressers", label: "Hair Dressers" },
  { value: "barbers-unisex", label: "Unisex Barbers" },
  { value: "barbers-male", label: "Men's Barbers" },
  { value: "barbers-female", label: "Ladies' Barbers" },
  { value: "nail-salon", label: "Nail Salon" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "dreadlocks", label: "Dreadlocks & Braids" },
];

const EVENT_TYPES = [
  { value: "vip_lounge", label: "VIP Lounge" },
  { value: "conference", label: "Conference / Exhibition" },
  { value: "festival", label: "Festival Grounds" },
  { value: "corporate", label: "Corporate Event" },
];

const venueTypeOptions = computed(() => {
  if (form.value.businessVertical === "salon") return SALON_TYPES;
  if (form.value.businessVertical === "event") return EVENT_TYPES;
  return RESTAURANT_TYPES;
});

const venueTypeLabel = computed(() => {
  if (form.value.businessVertical === "salon") return "Salon Type";
  if (form.value.businessVertical === "event") return "Event Type";
  return "Restaurant Type";
});

watch(
  () => form.value.businessVertical,
  (vertical) => {
    const defaults =
      vertical === "salon"
        ? "hair-dressers"
        : vertical === "event"
          ? "vip_lounge"
          : "full_service";
    if (form.value.restaurantType !== defaults) {
      form.value.restaurantType = defaults;
    }
  }
);

const filteredTenants = computed(() => {
  return tenants.value.filter((t) => {
    const matchesSearch =
      !searchQuery.value ||
      t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus =
      !filterStatus.value || t.status === filterStatus.value;
    const provisioning = provisioningStatuses.value[t.id];
    const matchesProvisioning =
      !filterProvisioning.value || provisioning === filterProvisioning.value;
    return matchesSearch && matchesStatus && matchesProvisioning;
  });
});

watch([searchQuery, filterStatus, filterProvisioning], () => {
  tenantsPage.value = 1;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(tenantsTotal.value / tenantsPageSize.value))
);

const loadDashboard = async () => {
  loading.value = true;
  try {
    const response = await tenantAdminAPI.getDashboard();
    dashboard.value = response.data;
  } finally {
    loading.value = false;
  }
};

const loadTenants = async () => {
  const response = await tenantAdminAPI.getAll({
    page: tenantsPage.value,
    pageSize: tenantsPageSize.value,
    status: filterStatus.value || undefined,
    search: searchQuery.value || undefined,
  });
  tenants.value = response.data.collection || [];
  tenantsTotal.value = response.data.total || 0;
};

const loadProvisioningStatuses = async () => {
  if (!tenants.value.length) return;
  const results = await Promise.all(
    tenants.value.map(async (tenant) => {
      try {
        const res = await tenantAdminAPI.getProvisioningStatus(tenant.id);
        return { tenantId: tenant.id, status: res.data?.item?.status || null };
      } catch {
        return { tenantId: tenant.id, status: null };
      }
    })
  );
  const map = {};
  for (const item of results) {
    map[item.tenantId] = item.status;
  }
  provisioningStatuses.value = map;
};

const loadPlans = async () => {
  try {
    const response = await planAPI.listPlans();
    plans.value = response.data.collection || [];
    if (plans.value.length > 0 && !form.value.plan) {
      form.value.plan = plans.value[0].slug;
    }
  } catch {
    plans.value = [];
  }
};

const accessTenant = (tenant) => {
  authStore.setTenant(tenant);
  router.push("/reservations");
};

const goTo = (path) => {
  router.push(path);
};

const viewTenant = (id) => {
  router.push(`/super-admin/tenants/${id}`);
};

const openCreateModal = () => {
  form.value = {
    name: "",
    slug: "",
    domain: "",
    plan: plans.value[0]?.slug || "starter",
    billingEmail: "",
    billingName: "",
    currency: "GHS",
  };
  wizardStep.value = 1;
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  wizardStep.value = 1;
};

const allSelected = computed({
  get: () =>
    filteredTenants.value.length > 0 &&
    selectedTenants.value.length === filteredTenants.value.length,
  set: () => {},
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedTenants.value = [];
  } else {
    selectedTenants.value = filteredTenants.value.map((t) => t.id);
  }
};

const clearSelection = () => {
  selectedTenants.value = [];
};

const openVerticalModal = () => {
  showVerticalModal.value = true;
};

const closeVerticalModal = () => {
  showVerticalModal.value = false;
};

const changeVertical = async () => {
  try {
    await tenantAdminAPI.bulkChangeVertical(
      selectedTenants.value,
      verticalForm.value.businessVertical
    );
    await loadTenants();
    await loadDashboard();
    closeVerticalModal();
    selectedTenants.value = [];
    toastStore?.add("Vertical updated successfully", "success");
  } catch (err) {
    toastStore?.add(
      err.response?.data?.message || "Failed to update vertical",
      "error"
    );
  }
};

const bulkProvision = async () => {
  try {
    await tenantAdminAPI.bulkProvisionTenants(selectedTenants.value);
    await loadProvisioningStatuses();
    selectedTenants.value = [];
    toastStore?.add("Provisioning started for selected tenants", "success");
  } catch (err) {
    toastStore?.add(
      err.response?.data?.message || "Failed to start provisioning",
      "error"
    );
  }
};

const createTenant = async () => {
  try {
    await tenantAdminAPI.create(form.value);
    await loadTenants();
    await loadDashboard();
    closeCreateModal();
  } catch (err) {
    toastStore?.add(
      err.response?.data?.message || "Failed to create tenant",
      "error",
      4000
    );
  }
};

const enableTenant = async (id) => {
  await tenantAdminAPI.enable(id);
  await loadTenants();
  await loadDashboard();
};

const disableTenant = async (id) => {
  if (
    !confirm(
      "Are you sure you want to disable this tenant? This will prevent them from accessing the platform."
    )
  )
    return;
  const reason = prompt("Reason for disabling tenant (optional):") || "";
  await tenantAdminAPI.disable(id, { reason });
  await loadTenants();
  await loadDashboard();
};

const formatMrr = (val) => {
  if (val == null) return "—";
  return Number(val).toLocaleString();
};

onMounted(async () => {
  await loadDashboard();
  await loadTenants();
  await loadProvisioningStatuses();
  await loadPlans();
});
</script>

<style scoped>
.tenant-dashboard {
  padding: var(--space-6);
}
.dashboard-header {
  margin-bottom: var(--space-6);
}
.dashboard-header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-5);
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
  margin-bottom: var(--space-2);
  font-weight: 500;
}
.card-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--ink);
  letter-spacing: var(--tracking-tight);
}
.card-value.success {
  color: var(--earth-600);
}
.card-value.warning {
  color: var(--accent-600);
}
.card-value.danger {
  color: var(--rose-600);
}
.card-value.muted {
  color: var(--ink-muted);
}
.card-value.info {
  color: var(--sky-600);
}
.quick-actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.qa-card {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--duration-150) var(--ease-in-out);
}
.qa-card:hover {
  border-color: var(--accent);
  background: var(--surface-sunken);
}
.qa-icon {
  font-size: 18px;
  line-height: 1;
}
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.tenant-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.tenant-table th,
.tenant-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.tenant-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.tenant-table tbody tr:hover {
  background: var(--surface-sunken);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.active {
  background: var(--earth-100);
  color: var(--earth-600);
}
.status-badge.past_due {
  background: var(--accent-100);
  color: var(--accent-600);
}
.status-badge.suspended {
  background: var(--rose-100);
  color: var(--rose-600);
}
.status-badge.cancelled {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.status-badge.trialing {
  background: var(--sky-100);
  color: var(--sky-600);
}
.provisioning-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.provisioning-badge.running {
  background: var(--accent-100);
  color: var(--accent-600);
}
.provisioning-badge.paused {
  background: var(--neutral-100);
  color: var(--neutral-700);
}
.provisioning-badge.completed {
  background: var(--earth-100);
  color: var(--earth-600);
}
.provisioning-badge.failed {
  background: var(--rose-100);
  color: var(--rose-600);
}
.provisioning-badge.rolled_back {
  background: var(--neutral-100);
  color: var(--neutral-500);
}
.provisioning-badge.unknown {
  background: var(--neutral-50);
  color: var(--neutral-500);
}
.actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.btn-small {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-small:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.btn-small.success {
  background: var(--earth-500);
  color: var(--white);
  border-color: var(--earth-500);
}
.btn-small.success:hover {
  background: var(--earth-600);
}
.btn-small.danger {
  background: var(--rose-500);
  color: var(--white);
  border-color: var(--rose-500);
}
.btn-small.danger:hover {
  background: var(--rose-600);
}

.btn-primary:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}

.btn-secondary:hover {
  border-color: var(--neutral-300);
  background: var(--surface-sunken);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 20, 16, 0.55);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border);
}
.modal h2 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
.slug-row {
  display: flex;
  gap: var(--space-2);
}
.slug-row input {
  flex: 1;
}
.bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--accent-soft);
  border: 1px solid var(--accent-200);
  border-radius: var(--radius-lg);
}
.bulk-count {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}
.modal-hint {
  margin: 0 0 var(--space-4) 0;
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.erpnext-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-success-light, #e6f4ea);
  color: var(--color-success, #1e7e34);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.text-muted {
  color: var(--ink-muted);
}
.wizard-steps {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.wizard-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  opacity: 0.6;
  transition: all var(--duration-150) var(--ease-in-out);
}
.wizard-step.active {
  opacity: 1;
  border-color: var(--accent);
  background: var(--surface);
}
.wizard-step.completed {
  opacity: 0.85;
  border-color: var(--brand-500);
}
.wizard-step-number {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: var(--text-xs);
  font-weight: 700;
  background: var(--border);
  color: var(--ink-muted);
  transition: all var(--duration-150) var(--ease-in-out);
}
.wizard-step.active .wizard-step-number {
  background: var(--accent);
  color: var(--white);
}
.wizard-step.completed .wizard-step-number {
  background: var(--brand-500);
  color: var(--white);
}
.wizard-step-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
}
.wizard-step.active .wizard-step-label {
  color: var(--ink);
}
.wizard-panel {
  margin-bottom: var(--space-4);
}
.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>

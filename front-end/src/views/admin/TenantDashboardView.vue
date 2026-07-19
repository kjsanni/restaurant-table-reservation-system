<template>
  <div class="tenant-dashboard">
    <div class="dashboard-header">
      <h1>Tenant Dashboard</h1>
      <p class="subtitle">Platform-wide subscription and tenant management</p>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Total Tenants</div>
        <div class="card-value">{{ dashboard.total }}</div>
      </div>
      <div class="card">
        <div class="card-label">Active</div>
        <div class="card-value success">{{ dashboard.active }}</div>
      </div>
      <div class="card">
        <div class="card-label">Past Due</div>
        <div class="card-value warning">{{ dashboard.pastDue }}</div>
      </div>
      <div class="card">
        <div class="card-label">Suspended</div>
        <div class="card-value danger">{{ dashboard.suspended }}</div>
      </div>
      <div class="card">
        <div class="card-label">Cancelled</div>
        <div class="card-value muted">{{ dashboard.cancelled }}</div>
      </div>
      <div class="card">
        <div class="card-label">MRR (GHS)</div>
        <div class="card-value">{{ dashboard.mrr }}</div>
      </div>
    </div>

    <div class="filters">
      <input
        v-model="searchQuery"
        placeholder="Search tenants..."
        class="search-input"
      />
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="past_due">Past Due</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
        <option value="trialing">Trialing</option>
      </select>
      <button @click="openCreateModal" class="btn-primary">+ Add Tenant</button>
    </div>

    <div
      v-if="showCreateModal"
      class="modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="modal">
        <h2>Create New Tenant</h2>
        <form @submit.prevent="createTenant">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>Slug *</label>
            <input v-model="form.slug" required />
          </div>
          <div class="form-group">
            <label>Domain</label>
            <input v-model="form.domain" />
          </div>
          <div class="form-group">
            <label>Plan</label>
            <select v-model="form.plan">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
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
          <div class="form-group">
            <label>Currency</label>
            <select v-model="form.currency">
              <option value="GHS">GHS</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="closeCreateModal"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">Create Tenant</button>
          </div>
        </form>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="tenant-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Subscription</th>
            <th>Next Billing</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in filteredTenants" :key="tenant.id">
            <td>{{ tenant.name }}</td>
            <td>{{ tenant.slug }}</td>
            <td>{{ tenant.plan }}</td>
            <td>
              <span :class="['status-badge', tenant.status]">{{
                tenant.status
              }}</span>
            </td>
            <td>{{ tenant.subscriptionStatus }}</td>
            <td>{{ formatDate(tenant.currentPeriodEnd) }}</td>
            <td class="actions">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const router = useRouter();
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
const searchQuery = ref("");
const filterStatus = ref("");
const showCreateModal = ref(false);
const form = ref({
  name: "",
  slug: "",
  domain: "",
  plan: "starter",
  billingEmail: "",
  billingName: "",
  currency: "GHS",
});

const filteredTenants = computed(() => {
  return tenants.value.filter((t) => {
    const matchesSearch =
      !searchQuery.value ||
      t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus =
      !filterStatus.value || t.status === filterStatus.value;
    return matchesSearch && matchesStatus;
  });
});

const loadDashboard = async () => {
  const response = await tenantAdminAPI.getDashboard();
  dashboard.value = response.data;
};

const loadTenants = async () => {
  const response = await tenantAdminAPI.getAll();
  tenants.value = response.data.collection || [];
};

const viewTenant = (id) => {
  router.push(`/admin/tenants/${id}`);
};

const openCreateModal = () => {
  form.value = {
    name: "",
    slug: "",
    domain: "",
    plan: "starter",
    billingEmail: "",
    billingName: "",
    currency: "GHS",
  };
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const createTenant = async () => {
  try {
    await tenantAdminAPI.create(form.value);
    await loadTenants();
    await loadDashboard();
    closeCreateModal();
  } catch (err) {
    alert(err.response?.data?.message || "Failed to create tenant");
  }
};

const enableTenant = async (id) => {
  await tenantAdminAPI.enable(id);
  await loadTenants();
  await loadDashboard();
};

const disableTenant = async (id) => {
  const reason = prompt("Reason for disabling tenant:");
  if (!reason) return;
  await tenantAdminAPI.disable(id, { reason });
  await loadTenants();
  await loadDashboard();
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

onMounted(async () => {
  await loadDashboard();
  await loadTenants();
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
  margin-bottom: var(--space-6);
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
.filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.search-input,
.filter-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.search-input {
  flex: 1;
  max-width: 320px;
}
.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
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
.actions {
  display: flex;
  gap: var(--space-2);
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
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-600) 100%);
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-primary:hover {
  background: linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%);
  box-shadow: var(--shadow-md);
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
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
</style>

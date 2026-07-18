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

    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
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
            <button type="button" @click="closeCreateModal" class="btn-secondary">Cancel</button>
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
  padding: 24px;
}
.dashboard-header {
  margin-bottom: 24px;
}
.dashboard-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
}
.subtitle {
  color: #64748b;
  margin: 0;
}
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.card {
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 12px;
  padding: 20px;
}
.card-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}
.card-value {
  font-size: 28px;
  font-weight: 600;
  color: #0d253d;
}
.card-value.success {
  color: #22c55e;
}
.card-value.warning {
  color: #f59e0b;
}
.card-value.danger {
  color: #ef4444;
}
.card-value.muted {
  color: #9ca3af;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.search-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  font-size: 14px;
}
.search-input {
  flex: 1;
  max-width: 320px;
}
.table-wrapper {
  overflow-x: auto;
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 12px;
}
.tenant-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.tenant-table th,
.tenant-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e3e8ee;
}
.tenant-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}
.status-badge.active {
  background: #dcfce7;
  color: #166534;
}
.status-badge.past_due {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.suspended {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.cancelled {
  background: #f3f4f6;
  color: #4b5563;
}
.status-badge.trialing {
  background: #dbeafe;
  color: #1e40af;
}
.actions {
  display: flex;
  gap: 8px;
}
.btn-small {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e3e8ee;
  background: #ffffff;
  cursor: pointer;
  font-size: 13px;
}
.btn-small.success {
  background: #22c55e;
  color: #ffffff;
  border-color: #22c55e;
}
.btn-small.danger {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
}
.btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #0d253d;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #e3e8ee;
  background: #ffffff;
  cursor: pointer;
  font-size: 14px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}
.modal h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e3e8ee;
  border-radius: 6px;
  font-size: 14px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>

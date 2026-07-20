<template>
  <div class="tenant-detail">
    <div class="header">
      <button @click="$router.back()" class="back-btn">← Back</button>
      <h1>{{ tenant.name }}</h1>
      <span :class="['status-badge', tenant.status]">{{ tenant.status }}</span>
      <button @click="accessTenant" class="btn-access">Access Tenant</button>
    </div>

    <div class="grid">
      <div class="section">
        <h2>Tenant Information</h2>
        <div class="info-row">
          <span class="label">Slug</span>
          <span class="value">{{ tenant.slug }}</span>
        </div>
        <div class="info-row">
          <span class="label">Domain</span>
          <span class="value">{{ tenant.domain || "—" }}</span>
        </div>
        <div class="info-row">
          <span class="label">Plan</span>
          <span class="value">{{ tenant.plan }}</span>
        </div>
        <div class="info-row">
          <span class="label">Currency</span>
          <span class="value">{{ tenant.currency }}</span>
        </div>
        <div class="info-row">
          <span class="label">Billing Email</span>
          <span class="value">{{ tenant.billingEmail || "—" }}</span>
        </div>
      </div>

      <div class="section">
        <h2>Subscription</h2>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="value">{{ tenant.subscriptionStatus }}</span>
        </div>
        <div class="info-row">
          <span class="label">Current Period End</span>
          <span class="value">{{ formatDate(tenant.currentPeriodEnd) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancel At Period End</span>
          <span class="value">{{
            tenant.cancelAtPeriodEnd ? "Yes" : "No"
          }}</span>
        </div>
        <div class="info-row">
          <span class="label">Grace Ends At</span>
          <span class="value">{{ formatDate(tenant.graceEndsAt) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Last Payment</span>
          <span class="value">{{ formatDate(tenant.lastPaymentAt) }}</span>
        </div>
      </div>

      <div class="section">
        <h2>Paystack (Bring Your Own Keys)</h2>
        <p class="section-hint">
          Override the platform Paystack account per tenant. Leave blank to use
          the platform default. Secret key is write-only.
        </p>
        <div class="field">
          <label>Subaccount Code</label>
          <input
            v-model="paystackForm.paystackSubaccountCode"
            placeholder="ACCT_..."
          />
        </div>
        <div class="field">
          <label>Public Key</label>
          <input
            v-model="paystackForm.paystackPublicKey"
            placeholder="pk_..."
          />
        </div>
        <div class="field">
          <label>Secret Key</label>
          <input
            v-model="paystackForm.paystackSecretKey"
            type="password"
            placeholder="sk_..."
          />
        </div>
        <button
          class="btn success"
          @click="savePaystack"
          :disabled="savingPaystack"
        >
          {{ savingPaystack ? "Saving..." : "Save Paystack Keys" }}
        </button>
        <span v-if="paystackSaved" class="saved-tag">Saved</span>
      </div>
    </div>

    <div class="actions">
      <button
        v-if="tenant.status === 'suspended' || tenant.status === 'past_due'"
        @click="enableTenant"
        class="btn success"
      >
        Enable Tenant
      </button>
      <button
        v-if="tenant.status === 'active' || tenant.status === 'past_due'"
        @click="disableTenant"
        class="btn danger"
      >
        Disable Tenant
      </button>
    </div>

    <div class="section users-section">
      <h2>Users ({{ tenant.users?.length || 0 }})</h2>
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in tenant.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const tenant = ref({ users: [] });
const savingPaystack = ref(false);
const paystackSaved = ref(false);
const paystackForm = ref({
  paystackSubaccountCode: "",
  paystackPublicKey: "",
  paystackSecretKey: "",
});

const loadTenant = async () => {
  const response = await tenantAdminAPI.getById(route.params.id);
  tenant.value = response.data.item;
  paystackForm.value = {
    paystackSubaccountCode: tenant.value.paystackSubaccountCode || "",
    paystackPublicKey: tenant.value.paystackPublicKey || "",
    paystackSecretKey: "",
  };
};

const accessTenant = () => {
  authStore.setTenant({
    id: tenant.value.id,
    name: tenant.value.name,
    slug: tenant.value.slug,
  });
  router.push("/reservations");
};

const enableTenant = async () => {
  await tenantAdminAPI.enable(route.params.id);
  await loadTenant();
};

const disableTenant = async () => {
  const reason = prompt("Reason for disabling tenant:");
  if (!reason) return;
  await tenantAdminAPI.disable(route.params.id, { reason });
  await loadTenant();
};

const savePaystack = async () => {
  savingPaystack.value = true;
  paystackSaved.value = false;
  try {
    const payload = { ...paystackForm.value };
    if (!payload.paystackSecretKey) delete payload.paystackSecretKey;
    await tenantAdminAPI.update(route.params.id, payload);
    paystackSaved.value = true;
    setTimeout(() => (paystackSaved.value = false), 2000);
    await loadTenant();
  } finally {
    savingPaystack.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

onMounted(() => {
  loadTenant();
});
</script>

<style scoped>
.tenant-detail {
  padding: var(--space-6);
  max-width: 960px;
}
.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
}
.back-btn:hover {
  color: var(--accent-600);
}
.btn-access {
  margin-left: auto;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn-access:hover {
  background: linear-gradient(
    135deg,
    var(--brand-600) 0%,
    var(--brand-500) 100%
  );
  box-shadow: var(--shadow-md);
}
.back-btn:hover {
  color: var(--accent-hover);
}
.header h1 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0;
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}
.section {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.section h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-4) 0;
  color: var(--ink);
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}
.value {
  font-weight: 500;
  font-size: var(--text-sm);
  color: var(--ink-secondary);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.section-hint {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0 0 var(--space-4) 0;
  line-height: var(--leading-relaxed);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 500;
}
.field input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.saved-tag {
  margin-left: var(--space-3);
  color: var(--earth-600);
  font-size: var(--text-sm);
  font-weight: 600;
}
.btn.success {
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: var(--white);
}
.btn.success:hover {
  box-shadow: var(--shadow-md);
}
.btn.danger {
  background: linear-gradient(135deg, var(--rose-500) 0%, var(--rose-600) 100%);
  color: var(--white);
}
.btn.danger:hover {
  box-shadow: var(--shadow-md);
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.users-table th,
.users-table td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.users-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.users-table tbody tr:hover {
  background: var(--surface-sunken);
}
</style>

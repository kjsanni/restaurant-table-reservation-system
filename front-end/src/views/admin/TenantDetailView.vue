<template>
  <div class="tenant-detail">
    <div class="header">
      <button @click="$router.back()" class="back-btn">← Back</button>
      <h1>{{ tenant.name }}</h1>
      <span :class="['status-badge', tenant.status]">{{ tenant.status }}</span>
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
import { useRoute } from "vue-router";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const route = useRoute();
const tenant = ref({ users: [] });

const loadTenant = async () => {
  const response = await tenantAdminAPI.getById(route.params.id);
  tenant.value = response.data.item;
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
  padding: 24px;
  max-width: 960px;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.back-btn {
  background: none;
  border: none;
  color: #533afd;
  cursor: pointer;
  font-size: 14px;
}
.header h1 {
  font-size: 24px;
  margin: 0;
}
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 13px;
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
.section {
  background: #ffffff;
  border: 1px solid #e3e8ee;
  border-radius: 12px;
  padding: 20px;
}
.section h2 {
  font-size: 16px;
  margin: 0 0 16px 0;
  color: #0d253d;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f6f9fc;
}
.info-row:last-child {
  border-bottom: none;
}
.label {
  color: #64748b;
  font-size: 14px;
}
.value {
  font-weight: 500;
  font-size: 14px;
}
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.btn {
  padding: 10px 20px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.btn.success {
  background: #22c55e;
  color: #ffffff;
}
.btn.danger {
  background: #ef4444;
  color: #ffffff;
}
.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.users-table th,
.users-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e3e8ee;
}
.users-table th {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
}
</style>

<template>
  <div class="cross-search-view">
    <div class="page-header">
      <div>
        <h1>Cross-Tenant Search</h1>
        <p class="subtitle">
          Search customers, reservations, and orders across all tenants
        </p>
      </div>
    </div>

    <div class="search-bar">
      <input
        v-model="query"
        class="search-input"
        placeholder="Search by name, email, phone, status..."
        @keydown.enter="search"
      />
      <button class="btn-primary" @click="search">Search</button>
    </div>

    <div v-if="loading" class="loading-state-inline">
      <div class="spinner-sm"></div>
    </div>

    <div v-else-if="searched" class="results">
      <div class="card" v-if="results.customers.length">
        <h2>Customers ({{ results.customers.length }})</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in results.customers"
                :key="`customer-${customer.id}`"
              >
                <td>{{ customer.firstName }} {{ customer.lastName }}</td>
                <td>{{ customer.email }}</td>
                <td>{{ customer.phone }}</td>
                <td>{{ customer.tenant?.name || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" v-if="results.reservations.length">
        <h2>Reservations ({{ results.reservations.length }})</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="reservation in results.reservations"
                :key="`reservation-${reservation.id}`"
              >
                <td>{{ reservation.resDate }}</td>
                <td>{{ reservation.resTime }}</td>
                <td>{{ reservation.resStatus }}</td>
                <td>
                  {{ reservation.customer?.firstName }}
                  {{ reservation.customer?.lastName }}
                </td>
                <td>{{ reservation.tenant?.name || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" v-if="results.orders.length">
        <h2>Orders ({{ results.orders.length }})</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in results.orders" :key="`order-${order.id}`">
                <td>{{ order.status }}</td>
                <td>{{ order.paymentStatus }}</td>
                <td>{{ formatCurrency(order.total) }}</td>
                <td>{{ order.tenant?.name || "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="
          !results.customers.length &&
          !results.reservations.length &&
          !results.orders.length
        "
        class="empty-state"
      >
        No results found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const query = ref("");
const searched = ref(false);
const results = ref({ customers: [], reservations: [], orders: [] });

const search = async () => {
  if (!query.value.trim()) return;
  loading.value = true;
  try {
    const res = await adminAPI.crossTenantSearch({ q: query.value });
    results.value = res.data || {};
    searched.value = true;
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GHS",
  }).format(value);
};
</script>

<style scoped>
.cross-search-view {
  padding: var(--space-6);
}
.page-header {
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
.search-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.search-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}
.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}
.card h2 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.data-table th {
  color: var(--ink-muted);
  font-weight: 600;
  font-size: var(--text-sm);
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>

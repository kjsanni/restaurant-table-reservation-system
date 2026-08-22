<template>
  <div class="anonymization-view">
    <div class="page-header">
      <div>
        <h1>Data Anonymization</h1>
        <p class="subtitle">Anonymize PII for dev/testing environments</p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="tenants.length === 0" class="empty-state">
        No tenants found
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Venue</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in tenants" :key="tenant.id">
              <td>{{ tenant.name }}</td>
              <td>{{ tenant.plan }}</td>
              <td>{{ tenant.status }}</td>
              <td>
                <button class="btn-primary" @click="anonymize(tenant.id)">
                  Anonymize
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import tenantAdminAPI from "@/services/tenantAdminAPI";

const loading = ref(false);
const tenants = ref([]);

const load = async () => {
  loading.value = true;
  try {
    const res = await tenantAdminAPI.getAll();
    tenants.value = res.data?.collection || res.data || [];
  } finally {
    loading.value = false;
  }
};

const anonymize = async (id) => {
  if (
    !confirm("This will anonymize all customer PII for this venue. Continue?")
  )
    return;
  await tenantAdminAPI.anonymizeData(id);
  alert("Anonymization complete");
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.anonymization-view {
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
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
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
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
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
</style>

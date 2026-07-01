<script setup lang="ts">
import PageHeader from "@/components/PageHeader.vue";
import { ref, onMounted } from "vue";
import auditAPI from "@/services/auditAPI";

const logs = ref([]);
const loading = ref(true);

onMounted(async () => {
  await loadLogs();
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await auditAPI.getAuditLogs();
    logs.value = res.data.logs;
  } catch (err) {
    console.error("Failed to load audit logs", err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};
</script>

<template>
  <div class="main-wrapper">
    <PageHeader title="Audit Logs" />
    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading logs...</p>
      </div>
      <div v-else class="table-card">
        <div class="table-wrapper">
          <table class="log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Type</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td>{{ formatDate(log.createdAt) }}</td>
                <td>{{ log.action }}</td>
                <td>
                  <span class="type-badge">{{ log.entityType }}</span>
                </td>
                <td>{{ log.userId }}</td>
              </tr>
              <tr v-if="!logs.length">
                <td colspan="4" class="empty-row">No audit logs found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
  height: var(--header-height);
  background: var(--lighter-gray) url("@/assets/images/reservations-header.jpg");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
.header h1 {
  margin-left: var(--x-spacing-mobile);
  margin-bottom: 15px;
  font-size: 35px;
  color: var(--snow-white);
  text-shadow: 1px 1px 2px var(--primary-black);
}

.content-wrapper {
  margin-top: 12px;
  margin-bottom: var(--page-margin-y);
  margin-left: var(--page-margin-x);
  margin-right: var(--page-margin-x);
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: var(--secondary-gray);
  font-family: "Inter-Light";
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--lighter-gray);
  border-top-color: var(--primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-card {
  background: var(--primary-white);
  border: 1px solid #f0f0f0;
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
}

.table-wrapper {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Inter-Light";
  font-size: 14px;
}

.log-table th,
.log-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.log-table th {
  background-color: #fafafa;
  color: var(--secondary-gray);
  font-family: "Inter-Medium";
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}

.log-table tbody tr:hover {
  background-color: #fafafa;
}

.log-table tbody tr:last-child td {
  border-bottom: none;
}

.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background-color: #eef2ff;
  color: var(--primary-blue);
  font-family: "Inter-Medium";
  font-size: 12px;
}

.empty-row {
  text-align: center;
  color: var(--secondary-gray);
  padding: 40px;
}

@media screen and (min-width: 1024px) {
  .header h1 {
    margin-left: var(--x-spacing-desktop);
    font-size: 45px;
    margin-bottom: 20px;
  }
  .content-wrapper {
    margin-left: 200px;
    margin-right: 200px;
  }
}
</style>

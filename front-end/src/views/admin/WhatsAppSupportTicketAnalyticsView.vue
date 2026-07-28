<template>
  <div class="support-analytics-view">
    <div class="page-header">
      <div>
        <h1>WhatsApp Support Ticket Analytics</h1>
        <p class="subtitle">Ticket volume, resolution time, and CSAT</p>
      </div>
      <div class="filters">
        <input v-model="from" type="date" class="field-input" />
        <input v-model="to" type="date" class="field-input" />
        <button class="btn-primary" @click="load">Apply</button>
      </div>
    </div>

    <div class="card">
      <h2>Summary</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else class="summary-grid">
        <div class="summary-item">
          <label>Total Tickets</label>
          <span>{{ analytics.total }}</span>
        </div>
        <div class="summary-item">
          <label>Open</label>
          <span>{{ analytics.open }}</span>
        </div>
        <div class="summary-item">
          <label>In Progress</label>
          <span>{{ analytics.inProgress }}</span>
        </div>
        <div class="summary-item">
          <label>Resolved</label>
          <span class="success">{{ analytics.resolved }}</span>
        </div>
        <div class="summary-item">
          <label>Closed</label>
          <span>{{ analytics.closed }}</span>
        </div>
        <div class="summary-item">
          <label>Avg Resolution (hrs)</label>
          <span>{{ analytics.avgResolutionHours }}</span>
        </div>
        <div class="summary-item">
          <label>Avg First Response (hrs)</label>
          <span>{{ analytics.avgFirstResponseHours }}</span>
        </div>
        <div class="summary-item">
          <label>CSAT</label>
          <span>{{ analytics.avgCsat }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const from = ref("");
const to = ref("");
const analytics = ref({});

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getWhatsAppSupportTicketAnalytics({
      from: from.value,
      to: to.value || undefined,
    });
    analytics.value = res.data || {};
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.support-analytics-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
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
.filters {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
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
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.card h2 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
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
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-4);
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.summary-item label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
}
.summary-item span {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--ink);
}
.success {
  color: var(--green-600);
}
</style>

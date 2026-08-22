<template>
  <div class="maintenance-view">
    <div class="page-header">
      <div>
        <h1>Maintenance Mode</h1>
        <p class="subtitle">Control platform-wide maintenance state</p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Current Status</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else class="status-block">
          <span class="badge" :class="statusClass(current.enabled)">
            {{ current.enabled ? "Enabled" : "Disabled" }}
          </span>
          <p v-if="current.message" class="message">{{ current.message }}</p>
          <p v-if="current.startedAt" class="meta">
            Started: {{ formatDate(current.startedAt) }}
          </p>
        </div>
      </div>

      <div class="card">
        <h3>Update Status</h3>
        <div class="form-group">
          <label>Enable Maintenance</label>
          <select v-model="form.enabled" class="filter-select">
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>
        <div class="form-group">
          <label>Message</label>
          <textarea
            v-model="form.message"
            rows="3"
            class="filter-select"
            placeholder="Message shown to users"
          ></textarea>
        </div>
        <button class="btn-primary" @click="save" :disabled="saving">
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const saving = ref(false);
const current = ref({ enabled: false, message: "", startedAt: null });
const form = ref({ enabled: false, message: "" });

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getMaintenanceMode();
    current.value = res.data || current.value;
    form.value.enabled = current.value.enabled;
    form.value.message = current.value.message || "";
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    const res = await adminAPI.setMaintenanceMode(form.value);
    current.value = res.data || current.value;
  } finally {
    saving.value = false;
  }
};

const statusClass = (enabled) => (enabled ? "status-failed" : "status-healthy");

onMounted(() => {
  load();
});
</script>

<style scoped>
.maintenance-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
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
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--ink);
}
.status-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.status-healthy {
  color: var(--earth-600);
}
.status-failed {
  color: var(--rose-600);
}
.message {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-muted);
}
.meta {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.form-group {
  margin-bottom: var(--space-3);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: var(--space-1);
}
.filter-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
}

.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
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
</style>

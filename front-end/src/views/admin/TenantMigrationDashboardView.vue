<template>
  <div class="migration-view">
    <div class="page-header">
      <div>
        <h1>Tenant Migration</h1>
        <p class="subtitle">
          Export and import tenant data between environments
        </p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Export Tenant</h3>
        <p class="subtitle">
          Export all tenant data including users, reservations, and settings
        </p>
        <div class="form-group">
          <label>Tenant ID</label>
          <input
            v-model="exportTenantId"
            type="number"
            placeholder="Enter tenant ID"
          />
        </div>
        <button class="btn-primary" @click="exportTenant" :disabled="exporting">
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
        <div v-if="exportResult" class="result">
          <pre>{{ JSON.stringify(exportResult, null, 2) }}</pre>
        </div>
      </div>

      <div class="card">
        <h3>Import Tenant</h3>
        <p class="subtitle">Import tenant data from a previous export</p>
        <div class="form-group">
          <label>Import Payload (JSON)</label>
          <textarea
            v-model="importPayload"
            rows="8"
            placeholder='{"tenant": {...}, "settings": [...]}'
          ></textarea>
        </div>
        <div class="form-group">
          <label>Target Tenant ID (optional)</label>
          <input
            v-model="targetTenantId"
            type="number"
            placeholder="Leave empty to create new tenant"
          />
        </div>
        <button class="btn-primary" @click="importTenant" :disabled="importing">
          {{ importing ? "Importing..." : "Import" }}
        </button>
        <div v-if="importResult" class="result">
          <pre>{{ JSON.stringify(importResult, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToastStore } from "@/stores/toast";
import adminAPI from "@/services/adminAPI";

const toastStore = useToastStore();

const exportTenantId = ref("");
const exporting = ref(false);
const exportResult = ref(null);

const importPayload = ref("");
const targetTenantId = ref("");
const importing = ref(false);
const importResult = ref(null);

const exportTenant = async () => {
  if (!exportTenantId.value) {
    toastStore.add("Tenant ID is required", "error");
    return;
  }
  exporting.value = true;
  exportResult.value = null;
  try {
    const res = await adminAPI.exportTenantMigration(exportTenantId.value);
    exportResult.value = res.data?.data || res.data;
    toastStore.add("Tenant exported successfully", "success");
  } catch (err) {
    toastStore.add(err.response?.data?.message || "Export failed", "error");
  } finally {
    exporting.value = false;
  }
};

const importTenant = async () => {
  if (!importPayload.value) {
    toastStore.add("Import payload is required", "error");
    return;
  }
  importing.value = true;
  importResult.value = null;
  try {
    const payload = JSON.parse(importPayload.value);
    const res = await adminAPI.importTenantMigration({
      ...payload,
      targetTenantId: targetTenantId.value
        ? parseInt(targetTenantId.value, 10)
        : undefined,
    });
    importResult.value = res.data;
    toastStore.add("Tenant imported successfully", "success");
  } catch (err) {
    toastStore.add(err.response?.data?.message || "Import failed", "error");
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.migration-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-3xl);
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
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-lg);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-1);
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.result {
  margin-top: var(--space-4);
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}
.result pre {
  margin: 0;
  font-size: var(--text-xs);
}
</style>

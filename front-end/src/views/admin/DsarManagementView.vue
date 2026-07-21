<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import dsarAPI from "@/services/dsarAPI";
import logger from "@/utils/logger";

const route = useRoute();

interface DsarRequest {
  id: number;
  requestType: string;
  status: string;
  requestData: Record<string, any> | null;
  staffNotes: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: number | null;
  ipAddress: string | null;
}

const tenantId = ref<number>(Number(route.params.tenantId) || 0);
const items = ref<DsarRequest[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const selected = ref<DsarRequest | null>(null);
const editingNotes = ref("");
const editingStatus = ref("");

const statusOptions = ["pending", "processing", "fulfilled", "rejected"];

const typeLabel: Record<string, string> = {
  access: "Data Access",
  erasure: "Right to Erasure",
  rectification: "Rectification",
  portability: "Data Portability",
  restriction: "Restriction",
  objection: "Objection",
};

const statusColor: Record<string, string> = {
  pending: "var(--accent-400, #f59e0b)",
  processing: "var(--brand-500, #8b5e3c)",
  fulfilled: "var(--earth-500, #22c55e)",
  rejected: "var(--rose-500, #ef4444)",
};

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await dsarAPI.listDsarRequests(tenantId.value);
    items.value = (res.data.items || []).map((r: any) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : "—",
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—",
      fulfilledAt: r.fulfilledAt
        ? new Date(r.fulfilledAt).toLocaleString()
        : null,
    }));
  } catch (err) {
    logger.error("dsar-list", { error: err });
    error.value = "Failed to load DSAR requests.";
  } finally {
    loading.value = false;
  }
}

function openEdit(item: DsarRequest) {
  selected.value = item;
  editingStatus.value = item.status;
  editingNotes.value = item.staffNotes || "";
}

async function saveEdit() {
  if (!selected.value) return;
  try {
    await dsarAPI.updateDsarRequest(tenantId.value, selected.value.id, {
      status: editingStatus.value,
      staffNotes: editingNotes.value,
    });
    selected.value = null;
    await load();
  } catch (err) {
    logger.error("dsar-update", { error: err });
  }
}
</script>

<template>
  <div class="main-wrapper">
    <div class="content-wrapper">
      <header class="topbar">
        <h1 class="page-title">DSAR Requests</h1>
        <p class="page-desc">
          Data Subject Access Requests — Act 843 / GDPR compliance
        </p>
      </header>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <p>Loading requests…</p>
      </div>

      <template v-else>
        <div v-if="items.length === 0" class="empty-state">
          <p>No DSAR requests for this tenant yet.</p>
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Requester</th>
                <th>Submitted</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ typeLabel[item.requestType] || item.requestType }}</td>
                <td>
                  <span
                    class="badge"
                    :style="{
                      background:
                        statusColor[item.status] || 'var(--neutral-500)',
                    }"
                  >
                    {{ item.status }}
                  </span>
                </td>
                <td>{{ item.requester || "Guest" }}</td>
                <td>{{ item.createdAt }}</td>
                <td>{{ item.updatedAt }}</td>
                <td>
                  <button class="btn btn-sm btn-ghost" @click="openEdit(item)">
                    Triage
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal">
          <h2>Triage DSAR #{{ selected.id }}</h2>
          <div class="form-group">
            <label>Request Type</label>
            <input
              :value="typeLabel[selected.requestType] || selected.requestType"
              disabled
            />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="editingStatus">
              <option v-for="s in statusOptions" :key="s" :value="s">
                {{ s }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Staff Notes</label>
            <textarea v-model="editingNotes" rows="4" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="selected = null">
              Cancel
            </button>
            <button class="btn btn-primary" @click="saveEdit">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: var(--text-2xl, 1.5rem);
  font-weight: 600;
  margin: 0;
}
.page-desc {
  color: var(--text-muted, #6b7280);
  margin: var(--space-1, 0.25rem) 0 0;
}
.topbar {
  margin-bottom: var(--space-6, 1.5rem);
}
.table-wrap {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 0.75rem);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}
.data-table th {
  background: var(--background-warm, #f9fafb);
  font-weight: 600;
  font-size: var(--text-sm, 0.875rem);
}
.badge {
  display: inline-block;
  padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
  border-radius: var(--radius-full, 9999px);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  color: #fff;
}
.btn {
  padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
  border-radius: var(--radius-md, 0.5rem);
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--text-sm, 0.875rem);
}
.btn-sm {
  padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
}
.btn-ghost {
  background: transparent;
  border-color: var(--border-subtle, #e5e7eb);
  color: var(--text-primary, #111827);
}
.btn-ghost:hover {
  background: var(--background-warm, #f9fafb);
}
.btn-primary {
  background: var(--brand-600, #7c4a2a);
  color: #fff;
}
.btn-primary:hover {
  background: var(--brand-700, #5c3520);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal, 50);
}
.modal {
  background: var(--surface, #ffffff);
  border-radius: var(--radius-lg, 0.75rem);
  padding: var(--space-6, 1.5rem);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
}
.form-group {
  margin-bottom: var(--space-4, 1rem);
}
.form-group label {
  display: block;
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  margin-bottom: var(--space-1, 0.25rem);
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 0.5rem);
  font-size: var(--text-sm, 0.875rem);
  background: var(--surface, #ffffff);
  color: var(--text-primary, #111827);
}
.modal-actions {
  display: flex;
  gap: var(--space-3, 0.75rem);
  justify-content: flex-end;
  margin-top: var(--space-4, 1rem);
}
.loading-state {
  text-align: center;
  padding: var(--space-8, 2rem);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle, #e5e7eb);
  border-top-color: var(--brand-600, #8b5e3c);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-3, 0.75rem);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-8, 2rem);
  color: var(--text-muted, #6b7280);
}
.alert {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-md, 0.5rem);
  margin-bottom: var(--space-4, 1rem);
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
</style>

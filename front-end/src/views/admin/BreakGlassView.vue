<template>
  <div class="break-glass-view">
    <div class="page-header">
      <div>
        <h1>Break-Glass Elevation</h1>
        <p class="subtitle">
          Request temporary super-admin access with approval workflow
        </p>
      </div>
      <button
        class="btn-primary"
        @click="showRequestForm = !showRequestForm"
        :disabled="loading"
      >
        {{ showRequestForm ? "Cancel" : "Request Elevation" }}
      </button>
    </div>

    <div v-if="showRequestForm" class="card request-form">
      <h3>Request Elevation</h3>
      <form @submit.prevent="submitRequest">
        <div class="form-group">
          <label>Justification</label>
          <textarea
            v-model="form.justification"
            rows="3"
            placeholder="Explain why you need elevated access..."
            required
          ></textarea>
        </div>
        <div class="form-group">
          <label>Duration (minutes, max {{ MAX_DURATION_MINUTES }})</label>
          <input
            v-model.number="form.durationMinutes"
            type="number"
            min="1"
            :max="MAX_DURATION_MINUTES"
            required
          />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? "Submitting..." : "Submit Request" }}
          </button>
          <button
            type="button"
            class="btn-secondary"
            @click="showRequestForm = false"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>My Requests</h3>
      <div v-if="myLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="myRequests.length === 0" class="empty-state">
        No break-glass requests yet.
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Justification</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Elevated Until</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in myRequests" :key="req.id">
              <td>#{{ req.id }}</td>
              <td>{{ req.justification }}</td>
              <td>{{ req.durationMinutes }} min</td>
              <td>
                <span class="badge" :class="statusClass(req.status)">{{
                  req.status
                }}</span>
              </td>
              <td>{{ formatDate(req.elevatedUntil) }}</td>
              <td>{{ formatDate(req.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Pending Approvals</h3>
      <div v-if="pendingLoading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="pendingRequests.length === 0" class="empty-state">
        No pending requests.
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requester</th>
              <th>Justification</th>
              <th>Duration</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in pendingRequests" :key="req.id">
              <td>#{{ req.id }}</td>
              <td>
                {{ req.requester?.username || req.requester?.email || "—" }}
              </td>
              <td>{{ req.justification }}</td>
              <td>{{ req.durationMinutes }} min</td>
              <td>{{ formatDate(req.createdAt) }}</td>
              <td class="actions">
                <button class="btn-primary btn-sm" @click="approve(req.id)">
                  Approve
                </button>
                <button class="btn-danger btn-sm" @click="deny(req.id)">
                  Deny
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
import adminAPI from "@/services/adminAPI";

const MAX_DURATION_MINUTES = 240;

const loading = ref(false);
const submitting = ref(false);
const showRequestForm = ref(false);
const myRequests = ref([]);
const pendingRequests = ref([]);
const myLoading = ref(false);
const pendingLoading = ref(false);

const form = ref({
  justification: "",
  durationMinutes: 60,
});

const withLoading = async (loadingRef, action) => {
  loadingRef.value = true;
  try {
    await action();
  } finally {
    loadingRef.value = false;
  }
};

const submitRequest = async () => {
  submitting.value = true;
  try {
    const res = await adminAPI.requestBreakGlass(
      form.value.justification,
      form.value.durationMinutes
    );
    if (res.data?.success) {
      form.value.justification = "";
      form.value.durationMinutes = 60;
      showRequestForm.value = false;
      await Promise.all([loadMyRequests(), loadPendingRequests()]);
    }
  } finally {
    submitting.value = false;
  }
};

const handleBreakGlassAction = async (actionFn, requestId) => {
  const notes = prompt(
    `${actionFn === adminAPI.approveBreakGlass ? "Approval" : "Denial"} notes (optional):`
  );
  if (notes === null) return;
  const res = await actionFn(requestId, notes || "");
  if (res.data?.success) {
    await Promise.all([loadPendingRequests(), loadMyRequests()]);
  }
};

const approve = (requestId) =>
  handleBreakGlassAction(adminAPI.approveBreakGlass, requestId);
const deny = (requestId) =>
  handleBreakGlassAction(adminAPI.denyBreakGlass, requestId);

const loadMyRequests = async () => {
  await withLoading(myLoading, async () => {
    const res = await adminAPI.listMyBreakGlassRequests();
    myRequests.value = res.data?.collection || [];
  });
};

const loadPendingRequests = async () => {
  await withLoading(pendingLoading, async () => {
    const res = await adminAPI.listBreakGlassRequests({ status: "pending" });
    pendingRequests.value = res.data?.collection || [];
  });
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

const statusClass = (status) => {
  const map = {
    pending: "status-warning",
    approved: "status-healthy",
    denied: "status-failed",
    expired: "status-failed",
    revoked: "status-failed",
  };
  return map[status] || "";
};

onMounted(() => {
  loadMyRequests();
  loadPendingRequests();
});
</script>

<style scoped>
.break-glass-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
}
.card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--card-radius);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}
.card h3 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
  font-weight: 600;
}
.request-form {
  background: var(--neutral-50);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}
.form-group textarea,
.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
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
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.data-table th {
  background: var(--neutral-50);
  font-weight: 600;
  font-size: var(--text-sm);
}
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}
.status-healthy {
  background: #dcfce7;
  color: #166534;
}
.status-warning {
  background: #fef3c7;
  color: #92400e;
}
.status-failed {
  background: #fee2e2;
  color: #991b1b;
}
.actions {
  display: flex;
  gap: var(--space-2);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  color: white;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  color: var(--ink-secondary);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-danger {
  padding: var(--space-2) var(--space-4);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  background: #fef2f2;
  color: #991b1b;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}
.loading-state-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>

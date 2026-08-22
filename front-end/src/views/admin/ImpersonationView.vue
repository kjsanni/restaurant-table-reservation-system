<template>
  <div class="impersonation-view">
    <div class="page-header">
      <div>
        <h1>Impersonation</h1>
        <p class="subtitle">
          Start and manage super-admin impersonation sessions
        </p>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h3>Start Impersonation</h3>
        <div class="form-group">
          <label>Venue User ID</label>
          <input
            v-model="targetUserId"
            type="number"
            class="filter-select"
            placeholder="e.g. 42"
          />
        </div>
        <div class="form-group">
          <label>Reason</label>
          <textarea
            v-model="reason"
            rows="3"
            class="filter-select"
            placeholder="Reason for impersonation"
          ></textarea>
        </div>
        <button
          class="btn-primary"
          @click="startImpersonation"
          :disabled="!targetUserId || starting"
        >
          {{ starting ? "Starting..." : "Start Impersonation" }}
        </button>
      </div>

      <div class="card">
        <h3>Active Sessions</h3>
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-sm"></div>
        </div>
        <div v-else-if="sessions.length === 0" class="empty-state">
          No active sessions
        </div>
        <div v-else class="session-list">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
          >
            <div>
              <b>User #{{ session.tenantUserId }}</b>
              <span>Expires: {{ formatDate(session.expiresAt) }}</span>
            </div>
            <button
              class="btn-danger"
              @click="endSession(session.id)"
              :disabled="endingId === session.id"
            >
              {{ endingId === session.id ? "Ending..." : "End" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const targetUserId = ref("");
const reason = ref("");
const starting = ref(false);
const sessions = ref([]);
const loading = ref(false);
const endingId = ref(null);

const startImpersonation = async () => {
  starting.value = true;
  try {
    const res = await adminAPI.startImpersonation({
      tenantUserId: targetUserId.value,
      reason: reason.value,
    });
    const token = res.data?.token;
    if (token) {
      window.location.reload();
    }
  } finally {
    starting.value = false;
  }
};

const loadSessions = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listImpersonation();
    sessions.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const endSession = async (id) => {
  endingId.value = id;
  try {
    await adminAPI.endImpersonation(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
  } finally {
    endingId.value = null;
  }
};

onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.impersonation-view {
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

.session-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-sunken);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}
.session-item div {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
}
.session-item b {
  font-size: var(--text-sm);
  color: var(--ink);
}
.session-item span {
  font-size: var(--text-xs);
  color: var(--ink-muted);
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
.empty-state {
  text-align: center;
  padding: var(--space-6);
  color: var(--ink-muted);
}
</style>

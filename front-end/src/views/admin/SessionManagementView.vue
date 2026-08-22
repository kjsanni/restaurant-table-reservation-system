<template>
  <div class="session-management-view">
    <div class="page-header">
      <div>
        <h1>Sessions</h1>
        <p class="subtitle">Manage your active super-admin sessions</p>
      </div>
      <button
        class="btn-danger"
        :disabled="sessions.length === 0 || revokingAll"
        @click="revokeAll"
      >
        {{ revokingAll ? "Revoking..." : "Revoke All Sessions" }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="sessions.length === 0" class="empty-state">
        No active sessions
      </div>
      <div v-else class="session-list">
        <div v-for="session in sessions" :key="session.id" class="session-item">
          <div class="session-info">
            <div class="session-meta">
              <b>Session #{{ session.id }}</b>
              <span
                class="session-badge"
                :class="
                  isExpiringSoon(session.expiresAt) ? 'expiring' : 'active'
                "
              >
                {{
                  isExpiringSoon(session.expiresAt) ? "Expiring soon" : "Active"
                }}
              </span>
            </div>
            <div class="session-details">
              <span v-if="session.ipAddress">IP: {{ session.ipAddress }}</span>
              <span v-if="session.userAgent">{{ session.userAgent }}</span>
              <span>Created: {{ formatDate(session.createdAt) }}</span>
              <span>Expires: {{ formatDate(session.expiresAt) }}</span>
            </div>
          </div>
          <button
            class="btn-danger"
            :disabled="revokingId === session.id"
            @click="revokeSingle(session.id)"
          >
            {{ revokingId === session.id ? "Revoking..." : "Revoke" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatDateTime } from "@/utils/format";

import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const sessions = ref([]);
const loading = ref(false);
const revokingId = ref(null);
const revokingAll = ref(false);

const loadSessions = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.listSessions();
    sessions.value = res.data?.collection || [];
  } finally {
    loading.value = false;
  }
};

const revokeSingle = async (id) => {
  if (!confirm("Are you sure?")) return;
  revokingId.value = id;
  try {
    await adminAPI.revokeSession(id);
    sessions.value = sessions.value.filter((s) => s.id !== id);
  } finally {
    revokingId.value = null;
  }
};

const revokeAll = async () => {
  const confirmed = window.confirm(
    "Revoke all active sessions? You will need to log in again on other devices."
  );
  if (!confirmed) return;
  revokingAll.value = true;
  try {
    await adminAPI.revokeAllSessions();
    sessions.value = [];
  } finally {
    revokingAll.value = false;
  }
};

const isExpiringSoon = (expiresAt) => {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000;
};

onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.session-management-view {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: flex-start;
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
  font-size: var(--text-sm);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
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
.session-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.session-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.session-meta b {
  font-size: var(--text-sm);
  color: var(--ink);
}
.session-badge {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
}
.session-badge.active {
  background: var(--accent-100);
  color: var(--accent-700);
}
.session-badge.expiring {
  background: var(--amber-100);
  color: var(--amber-700);
}
.session-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--ink-muted);
}
.session-details span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
</style>

<template>
  <div class="notification-center">
    <div class="page-header">
      <div>
        <h1>Notification Center</h1>
        <p class="subtitle">
          Platform notifications broadcast to tenants and administrators
        </p>
      </div>
    </div>

    <div class="layout">
      <div class="create-panel section">
        <h2>Create Notification</h2>
        <div class="field">
          <label>Type</label>
          <select v-model="form.type">
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="billing">Billing</option>
          </select>
        </div>
        <div class="field">
          <label>Title</label>
          <input v-model="form.title" placeholder="Notification title" />
        </div>
        <div class="field">
          <label>Message</label>
          <textarea
            v-model="form.message"
            rows="4"
            placeholder="Notification message"
          ></textarea>
        </div>
        <div class="field">
          <label>Tenant ID (optional)</label>
          <input
            v-model="form.tenantId"
            placeholder="Leave blank for all tenants"
          />
        </div>
        <button
          class="btn success"
          @click="create"
          :disabled="creating || !form.title || !form.message"
        >
          {{ creating ? "Sending..." : "Send Notification" }}
        </button>
      </div>

      <div class="list-panel">
        <div class="list-header">
          <h2>Notifications ({{ notifications.length }})</h2>
          <button class="btn" @click="loadNotifications">Refresh</button>
        </div>
        <div class="table-wrapper">
          <table class="notif-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th>Tenant</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="n in notifications"
                :key="n.id"
                :class="{ unread: !n.read }"
              >
                <td>
                  <span :class="['read-badge', n.read ? 'read' : 'unread']">
                    {{ n.read ? "Read" : "Unread" }}
                  </span>
                </td>
                <td>
                  <span :class="['type-badge', n.type]">{{ n.type }}</span>
                </td>
                <td class="title-cell">{{ n.title }}</td>
                <td class="msg-cell">{{ n.message }}</td>
                <td>{{ n.tenantId || "—" }}</td>
                <td>{{ formatDate(n.createdAt) }}</td>
                <td>
                  <button v-if="!n.read" class="btn small" @click="markRead(n)">
                    Mark Read
                  </button>
                </td>
              </tr>
              <tr v-if="!notifications.length">
                <td colspan="7" class="empty">No notifications found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import notificationAPI from "@/services/notificationAPI";

const notifications = ref([]);
const creating = ref(false);
const form = ref({
  type: "info",
  title: "",
  message: "",
  tenantId: "",
});

const loadNotifications = async () => {
  const response = await notificationAPI.listNotifications();
  notifications.value = response.data.collection || response.data.items || [];
};

const create = async () => {
  creating.value = true;
  try {
    const payload = {
      type: form.value.type,
      title: form.value.title,
      message: form.value.message,
    };
    if (form.value.tenantId) payload.tenantId = form.value.tenantId;
    await notificationAPI.createNotification(payload);
    form.value = { type: "info", title: "", message: "", tenantId: "" };
    await loadNotifications();
  } finally {
    creating.value = false;
  }
};

const markRead = async (n) => {
  await notificationAPI.markRead(n.id);
  n.read = true;
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notification-center {
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
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin: 0 0 var(--space-1) 0;
}
.subtitle {
  color: var(--ink-muted);
  margin: 0;
  font-size: var(--text-sm);
}
.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--space-6);
  align-items: start;
}
.section {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.create-panel h2,
.list-header h2 {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 650;
  margin: 0 0 var(--space-4) 0;
  color: var(--ink);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5);
  margin-bottom: var(--space-3);
}
.field label {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-weight: 500;
}
.field input,
.field select,
.field textarea {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  resize: vertical;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.btn {
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  background: var(--accent);
  color: var(--white);
  font-family: var(--font-sans);
  transition: all var(--duration-150) var(--ease-in-out);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  box-shadow: var(--shadow-md);
}
.btn.small {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}
.btn.success {
  background: linear-gradient(
    135deg,
    var(--earth-500) 0%,
    var(--earth-600) 100%
  );
  color: var(--white);
  width: 100%;
}
.btn.success:hover {
  box-shadow: var(--shadow-md);
}
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.table-wrapper {
  overflow-x: auto;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
.notif-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.notif-table th,
.notif-table td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.notif-table th {
  font-weight: 600;
  color: var(--ink-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  background: var(--neutral-50);
}
.notif-table tbody tr:hover {
  background: var(--surface-sunken);
}
.notif-table tbody tr.unread {
  background: var(--accent-soft);
}
.notif-table tbody tr.unread:hover {
  background: var(--accent-100);
}
.title-cell {
  font-weight: 600;
  color: var(--ink);
}
.msg-cell {
  color: var(--ink-muted);
  max-width: 320px;
}
.read-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}
.read-badge.read {
  background: var(--neutral-100);
  color: var(--neutral-600);
}
.read-badge.unread {
  background: var(--accent-100);
  color: var(--accent-600);
}
.type-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}
.type-badge.info {
  background: var(--sky-100);
  color: var(--sky-600);
}
.type-badge.warning {
  background: var(--accent-100);
  color: var(--accent-600);
}
.type-badge.success {
  background: var(--earth-100);
  color: var(--earth-600);
}
.type-badge.billing {
  background: var(--rose-100);
  color: var(--rose-600);
}
.empty {
  text-align: center;
  color: var(--ink-muted);
  padding: var(--space-6);
}
</style>

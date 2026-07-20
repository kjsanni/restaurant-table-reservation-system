<template>
  <div class="notification-center">
    <div class="page-header">
      <h1>Notifications</h1>
      <p class="subtitle">Platform-wide alerts and messages</p>
    </div>
    <div class="create-bar">
      <input v-model="newTitle" placeholder="Title" class="input" />
      <input v-model="newMessage" placeholder="Message" class="input" />
      <select v-model="newType" class="select">
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
        <option value="success">Success</option>
      </select>
      <input
        v-model.number="newTenantId"
        type="number"
        placeholder="Tenant ID (optional)"
        class="input small"
      />
      <button @click="createNotification" class="btn-primary">Send</button>
    </div>
    <div class="table-wrapper">
      <table class="notif-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Title</th>
            <th>Message</th>
            <th>Tenant</th>
            <th>Read</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in notifications" :key="n.id">
            <td>{{ formatDate(n.createdAt) }}</td>
            <td>
              <span :class="['type-badge', n.type]">{{ n.type }}</span>
            </td>
            <td>{{ n.title }}</td>
            <td>{{ n.message }}</td>
            <td>{{ n.tenantId || "—" }}</td>
            <td>
              <button
                v-if="!n.readAt"
                @click="markRead(n.id)"
                class="btn-small"
              >
                Mark Read
              </button>
              <span v-else class="read-label">Read</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import notificationAPI from "@/services/notificationAPI";

const notifications = ref([]);
const newTitle = ref("");
const newMessage = ref("");
const newType = ref("info");
const newTenantId = ref("");

const loadNotifications = async () => {
  const response = await notificationAPI.listNotifications();
  notifications.value = response.data.collection || [];
};

const createNotification = async () => {
  if (!newTitle.value || !newMessage.value) return;
  await notificationAPI.createNotification({
    type: newType.value,
    title: newTitle.value,
    message: newMessage.value,
    tenantId: newTenantId.value ? parseInt(newTenantId.value, 10) : null,
  });
  newTitle.value = "";
  newMessage.value = "";
  newTenantId.value = "";
  await loadNotifications();
};

const markRead = async (id) => {
  await notificationAPI.markRead(id);
  await loadNotifications();
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
.create-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.input.small {
  width: 140px;
}
.select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(
    135deg,
    var(--brand-700) 0%,
    var(--brand-600) 100%
  );
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  font-family: var(--font-sans);
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
.type-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
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
.type-badge.error {
  background: var(--rose-100);
  color: var(--rose-600);
}
.type-badge.success {
  background: var(--earth-100);
  color: var(--earth-600);
}
.read-label {
  color: var(--neutral-500);
  font-size: var(--text-xs);
}
.btn-small {
  padding: var(--space-1-5) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-secondary);
  cursor: pointer;
  font-size: var(--text-xs);
  font-family: var(--font-sans);
}
</style>

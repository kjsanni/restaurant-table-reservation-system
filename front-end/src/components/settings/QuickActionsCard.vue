<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import adminAPI from "@/services/adminAPI";
import { useToastStore } from "@/stores/toast";
import logger from "@/utils/logger";

const toastStore = useToastStore();
const sendingLogs = ref(false);
const logsSent = ref(false);

const sendLogs = async () => {
  sendingLogs.value = true;
  logsSent.value = false;
  try {
    await adminAPI.emailLogs();
    logsSent.value = true;
    toastStore.add("Logs sent successfully!", "success");
    setTimeout(() => (logsSent.value = false), 3000);
  } catch (err: any) {
    toastStore.add(err.response?.data?.message || "Failed to email logs", "error");
    logger.error("Failed to email logs", { error: err?.message });
  } finally {
    sendingLogs.value = false;
  }
};
</script>

<template>
  <div class="settings-card quick-actions-card">
    <h2 class="category-title">Quick Actions</h2>
    <div class="actions-grid">
      <RouterLink to="/staff/manage" class="action-card">
        <span class="action-icon">👥</span>
        <span>Manage Staff</span>
      </RouterLink>
      <RouterLink to="/roles/manage" class="action-card">
        <span class="action-icon">🔑</span>
        <span>Manage Roles</span>
      </RouterLink>
      <RouterLink to="/groups/manage" class="action-card">
        <span class="action-icon">🏷️</span>
        <span>Manage Groups</span>
      </RouterLink>
      <RouterLink to="/tables/manage" class="action-card">
        <span class="action-icon">🍽️</span>
        <span>Manage Tables</span>
      </RouterLink>
      <RouterLink to="/audit-logs" class="action-card">
        <span class="action-icon">📋</span>
        <span>Audit Logs</span>
      </RouterLink>
      <RouterLink to="/schedule" class="action-card">
        <span class="action-icon">📅</span>
        <span>Schedule</span>
      </RouterLink>
      <RouterLink to="/heatmap" class="action-card">
        <span class="action-icon">🗺️</span>
        <span>Heatmap</span>
      </RouterLink>
      <RouterLink to="/admin/payments" class="action-card">
        <span class="action-icon">💳</span>
        <span>Payments</span>
      </RouterLink>
      <button class="action-card" type="button" @click="sendLogs" :disabled="sendingLogs">
        <span class="action-icon">📧</span>
        <span>{{
          sendingLogs ? "Sending..." : logsSent ? "Logs Sent" : "Email Logs"
        }}</span>
      </button>
    </div>
  </div>
</template>

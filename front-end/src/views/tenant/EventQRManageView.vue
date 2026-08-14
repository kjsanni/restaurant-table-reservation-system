<template>
  <div class="event-qr-manage">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">← Back to Events</button>
      <h1>QR Codes</h1>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="codes.length === 0" class="empty-state">
        No QR codes generated yet
      </div>
      <div v-else class="qr-grid">
        <div v-for="code in codes" :key="code.id" class="qr-card">
          <div class="qr-label">{{ code.code || `QR #${code.id}` }}</div>
          <div class="qr-meta">Status: {{ code.status }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const codes = ref([]);

const eventId = route.params.eventId;

const load = async () => {
  loading.value = true;
  try {
    const res = await eventPortalAPI.getQRCodes(eventId);
    codes.value = res.data?.rows || res.data || [];
  } catch (err) {
    console.error("Failed to load QR codes", err);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/events/manage");
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.event-qr-manage {
  padding: var(--space-6);
}
.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0;
}
.card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}
.qr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}
.qr-card {
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--surface);
}
.qr-label {
  font-weight: 600;
  margin-bottom: var(--space-2);
}
.qr-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>

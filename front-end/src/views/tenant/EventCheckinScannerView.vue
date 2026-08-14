<template>
  <div class="event-checkin-scanner">
    <div class="page-header">
      <button class="btn-ghost btn-sm" @click="goBack">← Back to Events</button>
      <h1>Check-in Scanner</h1>
    </div>

    <div class="scanner-card">
      <p class="scanner-hint">
        Scan attendee QR codes to check them in to this event.
      </p>

      <div class="scan-form">
        <input
          v-model="token"
          placeholder="Enter or scan ticket code"
          class="scan-input"
          @keyup.enter="scan"
        />
        <button class="btn-primary" :disabled="scanning" @click="scan">
          {{ scanning ? "Checking..." : "Check In" }}
        </button>
      </div>

      <div v-if="result" class="scan-result" :class="resultClass">
        {{ result }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import eventPortalAPI from "@/services/eventPortalAPI";
import { useToastStore } from "@/stores/toast";

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

const token = ref("");
const scanning = ref(false);
const result = ref("");
const scannerApiKey = ref("");

const eventId = route.params.eventId;

const loadScannerConfig = async () => {
  try {
    const res = await eventPortalAPI.getScannerConfig();
    scannerApiKey.value = res.data?.config?.scannerApiKey || "";
  } catch (err) {
    console.error("Failed to load scanner config", err);
  }
};

const resultClass = computed(() => {
  if (!result.value) return "";
  if (
    result.value.toLowerCase().includes("success") ||
    result.value.toLowerCase().includes("checked in")
  ) {
    return "result-success";
  }
  return "result-error";
});

const scan = async () => {
  if (!token.value.trim()) return;
  scanning.value = true;
  result.value = "";
  try {
    const headers = {};
    if (scannerApiKey.value) {
      headers["x-api-key"] = scannerApiKey.value;
    }
    const res = await eventPortalAPI.checkinToken(token.value.trim(), {
      eventId,
    }, headers);
    const message = res.data?.message || "Check-in successful";
    result.value = message;
    toastStore.add(message, "success");
    token.value = "";
  } catch (err) {
    const message = err.response?.data?.message || "Check-in failed";
    result.value = message;
    toastStore.add(message, "error");
  } finally {
    scanning.value = false;
  }
};

const goBack = () => {
  router.push("/events/manage");
};

onMounted(() => {
  loadScannerConfig();
});
</script>

<style scoped>
.event-checkin-scanner {
  padding: var(--space-6);
  max-width: 640px;
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
.scanner-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}
.scanner-hint {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}
.scan-form {
  display: flex;
  gap: var(--space-3);
}
.scan-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
}
.scan-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.scan-result {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
}
.result-success {
  background: #e6f4ea;
  color: #1e7e34;
  border: 1px solid #b2dfdb;
}
.result-error {
  background: #fce8e8;
  color: #c92a2a;
  border: 1px solid #f5c6cb;
}
</style>

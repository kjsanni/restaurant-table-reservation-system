<template>
  <div class="paystack-config-view">
    <div class="page-header">
      <div>
        <h1>Paystack Configuration</h1>
        <p class="subtitle">
          Manage platform Paystack API credentials and rotation
        </p>
      </div>
    </div>

    <div class="card">
      <h2>Current Configuration</h2>
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else class="config-grid">
        <div class="config-item">
          <label>Mode</label>
          <span
            class="badge"
            :class="config.mode === 'live' ? 'badge-danger' : 'badge-info'"
          >
            {{ config.mode || "test" }}
          </span>
        </div>
        <div class="config-item">
          <label>Secret Key</label>
          <code>{{ maskedKey }}</code>
        </div>
        <div class="config-item">
          <label>Webhook Secret</label>
          <code>{{ maskedWebhook }}</code>
        </div>
        <div class="config-item">
          <label>Last Rotated</label>
          <span>{{
            config.rotatedAt
              ? new Date(config.rotatedAt).toLocaleString()
              : "Never"
          }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Rotate Secret Key</h2>
      <form @submit.prevent="rotate" class="rotate-form">
        <div class="field">
          <label>New Secret Key</label>
          <input
            v-model="form.newSecretKey"
            class="field-input"
            type="password"
            required
          />
        </div>
        <div class="field">
          <label>New Webhook Secret (optional)</label>
          <input
            v-model="form.newWebhookSecret"
            class="field-input"
            type="password"
          />
        </div>
        <div class="field">
          <label class="checkbox-label">
            <input v-model="form.confirm" type="checkbox" />
            I understand this will rotate the platform Paystack key
          </label>
        </div>
        <button
          class="btn-primary"
          type="submit"
          :disabled="rotating || !form.confirm"
        >
          {{ rotating ? "Rotating..." : "Rotate Key" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(false);
const rotating = ref(false);
const config = ref({});
const form = ref({
  newSecretKey: "",
  newWebhookSecret: "",
  confirm: false,
});

const maskedKey = () => {
  const key = config.value.secretKey || "";
  if (!key) return "Not set";
  return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
};

const maskedWebhook = () => {
  const key = config.value.webhookSecret || "";
  if (!key) return "Not set";
  return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.getPaystackConfig();
    config.value = res.data?.item || {};
  } finally {
    loading.value = false;
  }
};

const rotate = async () => {
  rotating.value = true;
  try {
    await adminAPI.rotatePaystackKey({
      newSecretKey: form.value.newSecretKey,
      newWebhookSecret: form.value.newWebhookSecret || undefined,
    });
    form.value = { newSecretKey: "", newWebhookSecret: "", confirm: false };
    await load();
  } finally {
    rotating.value = false;
  }
};

onMounted(() => {
  load();
});
</script>

<style scoped>
.paystack-config-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-5);
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
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}
.card h2 {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
}
.loading-state-inline {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
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
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}
.config-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.config-item label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink-muted);
}
.config-item code,
.config-item span {
  font-size: var(--text-sm);
  color: var(--ink);
}
.badge {
  display: inline-block;
  padding: var(--space-0-5) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}
.badge-danger {
  color: var(--rose-600);
}
.badge-info {
  color: var(--accent-600);
}
.rotate-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 480px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.field label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
}
.field-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}
.btn-primary {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  width: fit-content;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

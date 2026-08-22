<template>
  <div class="password-policy-view">
    <div class="page-header">
      <div>
        <h1>Password Policy</h1>
        <p class="subtitle">
          Configure platform-wide password requirements for staff accounts
        </p>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="loading-state-inline">
        <div class="spinner-sm"></div>
      </div>
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-primary" @click="loadPolicy">Retry</button>
      </div>
      <form v-else @submit.prevent="savePolicy">
        <div class="form-group">
          <label>Minimum length</label>
          <input
            v-model.number="policy.minLength"
            type="number"
            min="6"
            max="128"
            class="filter-select"
          />
          <small>Between 6 and 128 characters.</small>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="policy.requireUppercase" type="checkbox" />
            <span>Require at least one uppercase letter</span>
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="policy.requireLowercase" type="checkbox" />
            <span>Require at least one lowercase letter</span>
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="policy.requireNumber" type="checkbox" />
            <span>Require at least one number</span>
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input v-model="policy.requireSpecialChar" type="checkbox" />
            <span>Require at least one special character</span>
          </label>
        </div>

        <div class="actions">
          <button class="btn-primary" type="submit" :disabled="saving">
            {{ saving ? "Saving..." : "Save Policy" }}
          </button>
          <button
            class="btn-secondary"
            type="button"
            :disabled="saving"
            @click="resetDefaults"
          >
            Reset to defaults
          </button>
        </div>

        <p v-if="message" class="feedback" :class="messageType">
          {{ message }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";

const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const message = ref("");
const messageType = ref("success");

const defaults = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

const policy = ref({ ...defaults });

const loadPolicy = async () => {
  loading.value = true;
  error.value = null;
  message.value = "";
  try {
    const res = await authAPI.getSettings();
    const settings = res.data?.settings || [];
    const found = settings.find((s) => s.key === "password_policy");
    if (found && found.value) {
      policy.value = { ...defaults, ...found.value };
    } else {
      policy.value = { ...defaults };
    }
  } catch (e) {
    error.value = "Failed to load password policy.";
  } finally {
    loading.value = false;
  }
};

const savePolicy = async () => {
  saving.value = true;
  message.value = "";
  try {
    await authAPI.updateSettings("password_policy", policy.value);
    message.value = "Password policy saved.";
    messageType.value = "success";
  } catch (e) {
    message.value = "Failed to save password policy.";
    messageType.value = "error";
  } finally {
    saving.value = false;
  }
};

const resetDefaults = async () => {
  policy.value = { ...defaults };
  await savePolicy();
};

onMounted(() => {
  loadPolicy();
});
</script>

<style scoped>
.password-policy-view {
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
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  max-width: 640px;
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--ink);
  margin-bottom: var(--space-2);
}
.form-group small {
  color: var(--ink-muted);
  font-size: var(--text-xs);
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
.checkbox-group {
  margin-bottom: var(--space-3);
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--ink);
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--brand-700);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.feedback {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
}
.feedback.success {
  color: var(--accent-700);
}
.feedback.error {
  color: var(--rose-600);
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
.error-state {
  text-align: center;
  padding: var(--space-4);
}
.error-state p {
  color: var(--rose-600);
  margin-bottom: var(--space-3);
}
</style>

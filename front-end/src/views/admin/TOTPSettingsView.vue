<template>
  <div class="totp-settings-view">
    <div class="page-header">
      <div>
        <h1>Two-Factor Authentication</h1>
        <p class="subtitle">Manage TOTP settings for the super-admin account</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadStatus">Retry</button>
    </div>

    <div v-else class="totp-content">
      <div v-if="!enabled" class="setup-card">
        <h2>Set Up Two-Factor Authentication</h2>
        <p class="description">
          Scan the QR code below with an authenticator app (e.g. Google
          Authenticator, Authy) and enter the generated code to confirm setup.
        </p>

        <div v-if="!showSetup" class="setup-cta">
          <button class="btn-primary" @click="handleSetup" :disabled="saving">
            Enable TOTP
          </button>
        </div>

        <div v-else class="setup-flow">
          <div v-if="setupData" class="qr-section">
            <p class="step-label">Step 1 — Scan this QR code</p>
            <div class="qr-display">
              <code class="qr-url">{{ setupData.otpauthUrl }}</code>
            </div>
            <p class="step-label">Or enter this secret manually:</p>
            <div class="secret-display">
              <code>{{ setupData.secret }}</code>
              <button
                class="btn-ghost btn-sm"
                @click="copySecret"
                title="Copy secret"
              >
                Copy
              </button>
            </div>
          </div>

          <div v-if="setupData" class="confirm-section">
            <p class="step-label">
              Step 2 — Enter the code from your authenticator app
            </p>
            <div class="confirm-form">
              <input
                v-model="token"
                type="text"
                inputmode="numeric"
                placeholder="000000"
                maxlength="6"
                class="form-input totp-input"
                @keyup.enter="handleConfirm"
              />
              <button
                class="btn-primary"
                @click="handleConfirm"
                :disabled="saving"
              >
                Confirm
              </button>
            </div>
          </div>

          <div v-if="setupData" class="backup-codes-section">
            <p class="step-label">Step 3 — Save your backup codes</p>
            <div class="backup-codes">
              <div
                v-for="(code, i) in setupData.backupCodes"
                :key="i"
                class="backup-code"
              >
                <code>{{ code }}</code>
              </div>
            </div>
            <p class="helper-text">
              Store these backup codes securely. Each code can be used once if
              you lose access to your authenticator app.
            </p>
          </div>

          <div v-if="confirmError" class="error-message">
            {{ confirmError }}
          </div>
        </div>
      </div>

      <div v-else class="active-card">
        <h2>TOTP Is Enabled</h2>
        <div class="status-badge enabled">Active</div>

        <div class="actions">
          <div class="action-group">
            <h3>Backup Codes</h3>
            <p class="description">
              Regenerate backup codes if any have been lost or compromised.
            </p>
            <button
              class="btn-secondary"
              @click="handleRegenerateCodes"
              :disabled="saving"
            >
              Regenerate Codes
            </button>
            <div v-if="regeneratedCodes" class="backup-codes">
              <div
                v-for="(code, i) in regeneratedCodes"
                :key="i"
                class="backup-code"
              >
                <code>{{ code }}</code>
              </div>
            </div>
          </div>

          <div class="action-group">
            <h3>Disable TOTP</h3>
            <p class="description">
              Turning off two-factor authentication reduces account security.
            </p>
            <button
              class="btn-danger"
              @click="showDisableConfirm = true"
              :disabled="saving"
            >
              Disable TOTP
            </button>
          </div>
        </div>
      </div>

      <div v-if="showDisableConfirm" class="confirm-dialog">
        <p>
          Are you sure you want to disable TOTP? This will remove two-factor
          authentication for the super-admin account.
        </p>
        <div class="dialog-actions">
          <button class="btn-danger" @click="handleDisable" :disabled="saving">
            Yes, Disable
          </button>
          <button class="btn-ghost" @click="showDisableConfirm = false">
            Cancel
          </button>
        </div>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import adminAPI from "@/services/adminAPI";

const loading = ref(true);
const saving = ref(false);
const error = ref(null);
const successMessage = ref(null);
const confirmError = ref(null);

const enabled = ref(false);
const confirmed = ref(false);

const showSetup = ref(false);
const setupData = ref(null);
const token = ref("");

const showDisableConfirm = ref(false);
const regeneratedCodes = ref(null);

const clearSuccess = () => {
  if (successMessage.value) {
    setTimeout(() => {
      successMessage.value = null;
    }, 5000);
  }
};

const loadStatus = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await adminAPI.getTOTPStatus();
    enabled.value = res.data?.enabled || false;
    confirmed.value = res.data?.confirmed || false;
  } catch (e) {
    error.value = "Failed to load TOTP status.";
  } finally {
    loading.value = false;
  }
};

const handleSetup = async () => {
  saving.value = true;
  confirmError.value = null;
  try {
    const res = await adminAPI.setupTOTP();
    setupData.value = res.data;
    showSetup.value = true;
  } catch (e) {
    error.value = "Failed to start TOTP setup.";
  } finally {
    saving.value = false;
  }
};

const handleConfirm = async () => {
  saving.value = true;
  confirmError.value = null;
  try {
    await adminAPI.confirmTOTP(token.value.trim());
    enabled.value = true;
    confirmed.value = true;
    showSetup.value = false;
    setupData.value = null;
    token.value = "";
    successMessage.value = "TOTP enabled successfully.";
    clearSuccess();
  } catch (e) {
    confirmError.value =
      e.response?.data?.message || "Invalid TOTP token. Please try again.";
  } finally {
    saving.value = false;
  }
};

const handleDisable = async () => {
  saving.value = true;
  try {
    await adminAPI.disableTOTP();
    enabled.value = false;
    confirmed.value = false;
    showDisableConfirm.value = false;
    successMessage.value = "TOTP disabled successfully.";
    clearSuccess();
  } catch (e) {
    error.value = "Failed to disable TOTP.";
  } finally {
    saving.value = false;
  }
};

const handleRegenerateCodes = async () => {
  saving.value = true;
  regeneratedCodes.value = null;
  try {
    const res = await adminAPI.regenerateBackupCodes();
    regeneratedCodes.value = res.data?.backupCodes || [];
    successMessage.value = "Backup codes regenerated. Save them securely.";
    clearSuccess();
  } catch (e) {
    error.value = "Failed to regenerate backup codes.";
  } finally {
    saving.value = false;
  }
};

const copySecret = () => {
  if (setupData.value?.secret) {
    navigator.clipboard.writeText(setupData.value.secret);
  }
};

onMounted(() => {
  loadStatus();
});
</script>

<style scoped>
.totp-settings-view {
  padding: var(--space-6);
}
.page-header {
  margin-bottom: var(--space-6);
}
.page-header h1 {
  margin: 0 0 var(--space-1);
}
.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}
.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-8);
}
.totp-content {
  max-width: 640px;
}
.setup-card,
.active-card {
  background: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}
.setup-card h2,
.active-card h2 {
  margin: 0 0 var(--space-2);
}
.description {
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4);
}
.setup-cta {
  margin-top: var(--space-4);
}
.setup-flow {
  margin-top: var(--space-4);
}
.step-label {
  font-weight: var(--font-weight-semibold);
  margin: var(--space-4) 0 var(--space-2);
}
.qr-display {
  background: var(--color-surface-alt);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}
.qr-url {
  word-break: break-all;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.secret-display {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-surface-alt);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.secret-display code {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wider);
}
.confirm-form {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.totp-input {
  width: 140px;
  text-align: center;
  font-size: var(--font-size-xl);
  letter-spacing: var(--letter-spacing-widest);
}
.backup-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.backup-code {
  background: var(--color-surface-alt);
  border: var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
}
.backup-code code {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
.helper-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-4);
}
.confirm-dialog {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface-alt);
  border: var(--border-default);
  border-radius: var(--radius-md);
}
.confirm-dialog p {
  margin: 0 0 var(--space-3);
}
.dialog-actions {
  display: flex;
  gap: var(--space-3);
}
.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
.status-badge.enabled {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}
.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-top: var(--space-6);
}
.action-group h3 {
  margin: 0 0 var(--space-2);
}
.action-group .description {
  margin-bottom: var(--space-3);
}
.error-message {
  color: var(--color-error);
  margin-top: var(--space-3);
}
.success-message {
  color: var(--color-success);
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-success-bg);
  border-radius: var(--radius-md);
}
</style>

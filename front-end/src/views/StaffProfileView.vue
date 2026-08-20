<script setup lang="ts">
import { ref, onMounted } from "vue";
import authAPI from "@/services/authAPI";
import logger from "@/utils/logger";

const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const phone = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");

const loadProfile = async () => {
  loading.value = true;
  try {
    const res = await authAPI.getMe();
    const user = res.data?.user;
    if (user) {
      phone.value = user.phone || "";
    }
  } catch (err) {
    logger.error("Failed to load profile", { error: err });
  } finally {
    loading.value = false;
  }
};

const submitProfile = async () => {
  if (newPassword.value && newPassword.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }
  saving.value = true;
  error.value = "";
  saved.value = false;
  try {
    const updates: any = { phone: phone.value.trim() };
    if (newPassword.value) {
      updates.password = newPassword.value;
    }
    await authAPI.updateProfile(updates);
    saved.value = true;
    newPassword.value = "";
    confirmPassword.value = "";
    setTimeout(() => {
      saved.value = false;
    }, 3000);
  } catch (err) {
    error.value = err?.response?.data?.message || "Failed to update profile";
  } finally {
    saving.value = false;
  }
};

onMounted(loadProfile);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>My Profile</h1>
        <p>Update your phone number and password</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div v-else class="settings-stack">
        <div class="settings-card">
          <h3>Phone Number</h3>
          <p class="settings-hint">
            Used for WhatsApp OTP login if WhatsApp is enabled for your tenant.
          </p>
          <input
            v-model="phone"
            class="field-input"
            type="tel"
            placeholder="+233..."
          />
        </div>

        <div class="settings-card">
          <h3>Change Password</h3>
          <p class="settings-hint">
            Leave blank to keep your current password. New password must be at
            least 12 characters with uppercase, lowercase, number, and special
            character.
          </p>
          <div class="form-group">
            <label>New Password</label>
            <input
              v-model="newPassword"
              class="field-input"
              type="password"
              autocomplete="new-password"
            />
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input
              v-model="confirmPassword"
              class="field-input"
              type="password"
              autocomplete="new-password"
            />
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="saved" class="alert alert-success">
          Profile updated successfully!
        </div>

        <button class="btn-primary" @click="submitProfile" :disabled="saving">
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-wrapper {
  min-height: 100vh;
  background: var(--background-warm);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.topbar-left p {
  color: var(--neutral-600);
  font-size: 14px;
  margin-top: 4px;
}

.content-wrapper {
  flex: 1;
  margin: var(--space-8) var(--space-6);
  max-width: var(--content-max-width);
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1024px) {
  .content-wrapper {
    margin-top: var(--space-10);
    margin-bottom: var(--space-10);
  }
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 8px 24px rgba(26, 20, 16, 0.04);
}

.settings-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900);
  margin: 0 0 8px;
}

.settings-hint {
  color: var(--neutral-600);
  font-size: 14px;
  margin: 0 0 16px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-700);
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-lg);
  font-size: 14px;
  background: var(--white);
  color: var(--neutral-900);
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15);
}

.loading-state {
  text-align: center;
  padding: 48px;
  color: var(--neutral-600);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 14px;
}

.alert-danger {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background: var(--brand-500);
  color: var(--white);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-600);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

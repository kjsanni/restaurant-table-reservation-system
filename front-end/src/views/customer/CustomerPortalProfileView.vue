<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

const authStore = useAuthStore();

const profile = ref({
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
});
const saving = ref(false);
const saved = ref(false);
const loading = ref(true);
const errorMsg = ref("");
const fieldErrors = ref<Record<string, string>>({});

let savedTimer: ReturnType<typeof setTimeout> | null = null;

const clearSavedTimer = () => {
  if (savedTimer) {
    clearTimeout(savedTimer);
    savedTimer = null;
  }
};

const validate = () => {
  const errors: Record<string, string> = {};
  if (!profile.value.firstName.trim())
    errors.firstName = "First name is required";
  if (!profile.value.lastName.trim()) errors.lastName = "Last name is required";
  if (!profile.value.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.value.email)) {
    errors.email = "Enter a valid email";
  }
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const loadProfile = async () => {
  loading.value = true;
  errorMsg.value = "";
  try {
    const res = await customerPortalAPI.getProfile();
    if (res.data.success && res.data.customer) {
      profile.value = res.data.customer;
    } else {
      profile.value = {
        firstName: authStore.user?.username || "",
        lastName: "",
        phone: "",
        email: authStore.user?.email || "",
      };
    }
  } catch (err) {
    errorMsg.value = "Failed to load profile. Please try again.";
    logger.error("Failed to load profile", { error: err });
    profile.value = {
      firstName: authStore.user?.username || "",
      lastName: "",
      phone: "",
      email: authStore.user?.email || "",
    };
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  if (!validate()) return;
  saving.value = true;
  saved.value = false;
  clearSavedTimer();
  try {
    await customerPortalAPI.updateProfile(profile.value);
    saved.value = true;
    savedTimer = setTimeout(() => (saved.value = false), 2000);
  } catch (err) {
    logger.error("Failed to save profile", { error: err });
  } finally {
    saving.value = false;
  }
};

onMounted(loadProfile);
onUnmounted(clearSavedTimer);
</script>

<template>
  <div class="main-wrapper">
    <div class="topbar">
      <div class="topbar-left">
        <h1>My Profile</h1>
        <p>Manage your details and preferences</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>
      <div v-else class="settings-stack">
        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
        <div class="settings-card">
          <h3>Profile</h3>
          <div class="form-row">
            <div class="field">
              <label for="profile-firstName">First Name</label>
              <input
                id="profile-firstName"
                v-model="profile.firstName"
                class="field-input"
                :class="{ 'input-error': fieldErrors.firstName }"
                :aria-invalid="!!fieldErrors.firstName"
                aria-required="true"
              />
              <span v-if="fieldErrors.firstName" class="field-error">{{
                fieldErrors.firstName
              }}</span>
            </div>
            <div class="field">
              <label for="profile-lastName">Last Name</label>
              <input
                id="profile-lastName"
                v-model="profile.lastName"
                class="field-input"
                :class="{ 'input-error': fieldErrors.lastName }"
                :aria-invalid="!!fieldErrors.lastName"
                aria-required="true"
              />
              <span v-if="fieldErrors.lastName" class="field-error">{{
                fieldErrors.lastName
              }}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="profile-email">Email</label>
              <input
                id="profile-email"
                v-model="profile.email"
                class="field-input"
                type="email"
                :class="{ 'input-error': fieldErrors.email }"
                :aria-invalid="!!fieldErrors.email"
                aria-required="true"
              />
              <span v-if="fieldErrors.email" class="field-error">{{
                fieldErrors.email
              }}</span>
            </div>
            <div class="field">
              <label for="profile-phone">Phone</label>
              <input
                id="profile-phone"
                v-model="profile.phone"
                class="field-input"
                type="tel"
              />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" :disabled="saving" @click="saveProfile">
              {{ saving ? "Saving..." : saved ? "Saved" : "Save Changes" }}
            </button>
          </div>
        </div>
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 12px;
  color: var(--neutral-600);
}

.spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-600);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-banner {
  background: var(--rose-50);
  color: var(--rose-700);
  border: 1px solid var(--rose-200);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 14px;
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
  gap: 18px;
  max-width: 760px;
}

.settings-card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(26, 20, 16, 0.05);
}

.settings-card h3 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--neutral-900);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-800);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-sans);
}

.field-input {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  background: var(--white);
  color: var(--neutral-900);
  font-size: 14px;
  outline: none;
}

.field-input:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.input-error {
  border-color: var(--rose-500);
}

.field-error {
  font-size: 12px;
  color: var(--rose-600);
}

.form-actions {
  margin-top: 8px;
}

.btn-primary {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand-600);
  color: var(--white);
  font-weight: 700;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--neutral-200);
  background: var(--white);
}

.topbar-left h1 {
  font-family: var(--font-serif);
  font-size: 22px;
  margin: 0;
}

.topbar-left p {
  margin: 4px 0 0;
  color: var(--neutral-600);
  font-size: 14px;
}
</style>

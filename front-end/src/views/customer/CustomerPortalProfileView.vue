<script setup lang="ts">
import { ref, onMounted } from "vue";
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

const loadProfile = async () => {
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
    logger.error("Failed to load profile", { error: err });
    profile.value = {
      firstName: authStore.user?.username || "",
      lastName: "",
      phone: "",
      email: authStore.user?.email || "",
    };
  }
};

const saveProfile = async () => {
  saving.value = true;
  saved.value = false;
  try {
    await customerPortalAPI.updateProfile(profile.value);
    saved.value = true;
    setTimeout(() => (saved.value = false), 2000);
  } catch (err) {
    logger.error("Failed to save profile", { error: err });
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
        <p>Manage your details and preferences</p>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="settings-stack">
        <div class="settings-card">
          <h3>Profile</h3>
          <div class="form-row">
            <div class="field">
              <label>First Name</label>
              <input v-model="profile.firstName" class="field-input" />
            </div>
            <div class="field">
              <label>Last Name</label>
              <input v-model="profile.lastName" class="field-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Email</label>
              <input v-model="profile.email" class="field-input" type="email" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input v-model="profile.phone" class="field-input" />
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
  padding: 12px 14px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--neutral-50);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field-input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn-primary {
  padding: 11px 18px;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(74, 53, 43, 0.22);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

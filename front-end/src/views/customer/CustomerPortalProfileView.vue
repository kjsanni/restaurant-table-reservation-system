<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import customerPortalAPI from "@/services/customerPortalAPI";
import logger from "@/utils/logger";

const authStore = useAuthStore();
const toastStore = useToastStore();

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
    const res = await customerPortalAPI.updateProfile(profile.value);
    if (res.data.success) {
      saved.value = true;
      toastStore.add("Profile updated successfully", "success");
      setTimeout(() => (saved.value = false), 2000);
    } else {
      toastStore.add(res.data.message || "Failed to update profile", "error");
    }
  } catch (err) {
    logger.error("Failed to save profile", { error: err });
    toastStore.add("Failed to update profile", "error");
  } finally {
    saving.value = false;
  }
};

onMounted(loadProfile);
</script>

<template>
  <div class="page">
    <VaCard>
      <h1 class="page-title">My Profile</h1>
      <form @submit.prevent="saveProfile" class="form">
        <div class="form-row">
          <VaInput
            v-model="profile.firstName"
            label="First Name"
            class="form-field"
          />
          <VaInput
            v-model="profile.lastName"
            label="Last Name"
            class="form-field"
          />
        </div>
        <div class="form-row">
          <VaInput
            v-model="profile.email"
            label="Email"
            type="email"
            class="form-field"
            disabled
          />
          <VaInput v-model="profile.phone" label="Phone" class="form-field" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? "Saving..." : saved ? "Saved" : "Save Profile" }}
          </button>
        </div>
      </form>
    </VaCard>
  </div>
</template>

<style scoped>
.page {
  padding: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}
.page-title {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
  margin-bottom: var(--space-4);
}
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.form-row {
  display: flex;
  gap: var(--space-4);
}
.form-field {
  flex: 1;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-4);
}
</style>

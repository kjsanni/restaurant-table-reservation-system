<script setup lang="ts">
import { VaButton, VaCard, VaCardContent, VaInput, VaAlert } from "vuestic-ui";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";

const router = useRouter();
const authStore = useAuthStore();

const user = ref({
  username: "",
  email: "",
  password: "",
});

const validationErrors = ref<Record<string, string[]> | null>(null);
const isSuccessful = ref(false);
const generalError = ref<string | null>(null);
const registrationEnabled = ref(true);

const passwordRequirements = computed(() => [
  { label: "12+ characters", met: user.value.password.length >= 12 },
  { label: "One lowercase", met: /[a-z]/.test(user.value.password) },
  { label: "One uppercase", met: /[A-Z]/.test(user.value.password) },
  { label: "One number", met: /[0-9]/.test(user.value.password) },
  { label: "One special char", met: /[^a-zA-Z0-9]/.test(user.value.password) },
]);

const allRequirementsMet = computed(() =>
  passwordRequirements.value.every((r) => r.met)
);

onMounted(async () => {
  registrationEnabled.value = await authStore.fetchRegistrationStatus();
});

const handleRegister = async () => {
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;

  if (!registrationEnabled.value) {
    generalError.value = "Registration is currently disabled!";
    return;
  }

  try {
    await authStore.register(
      user.value.username,
      user.value.email,
      user.value.password
    );
    isSuccessful.value = true;
    setTimeout(() => router.push("/login"), 2000);
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <VaCard class="auth-card" flat>
      <VaCardContent>
        <div class="auth-header">
          <div class="brand">
            <span class="brand-icon">🍽️</span>
            <span class="brand-text">RTRS</span>
          </div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join the restaurant system</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <VaInput
            v-model="user.username"
            label="Username"
            :error-messages="validationErrors?.username"
            autocomplete="username"
            class="auth-input"
          />
          <VaInput
            v-model="user.email"
            label="Email"
            type="email"
            :error-messages="validationErrors?.email"
            autocomplete="email"
            class="auth-input"
          />
          <VaInput
            v-model="user.password"
            label="Password"
            type="password"
            :error-messages="validationErrors?.password"
            autocomplete="new-password"
            class="auth-input"
          />

          <div class="password-requirements">
            <p class="requirements-title">Password requirements</p>
            <ul class="requirements-list">
              <li
                v-for="req in passwordRequirements"
                :key="req.label"
                :class="{ 'requirement-met': req.met }"
              >
                {{ req.label }}
              </li>
            </ul>
          </div>

          <VaAlert v-if="isSuccessful" color="success" class="auth-alert">
            Successfully registered! Redirecting to login...
          </VaAlert>

          <VaAlert v-if="generalError" color="danger" class="auth-alert">
            {{ generalError }}
          </VaAlert>

          <VaButton
            block
            type="submit"
            :disabled="!registrationEnabled || !allRequirementsMet"
            class="auth-submit"
          >
            Register
          </VaButton>
        </form>

        <div class="auth-footer">
          <RouterLink to="/login" class="auth-link"
            >Already have an account?</RouterLink
          >
        </div>
      </VaCardContent>
    </VaCard>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--restaurant-background);
}

.auth-card {
  width: 100%;
  max-width: 380px;
  border-radius: 8px;
  border: 2px solid var(--restaurant-border);
  box-shadow: 4px 4px 0 var(--restaurant-border);
}

.auth-card:hover {
  box-shadow: 6px 6px 0 var(--restaurant-border);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.brand-icon {
  font-size: 28px;
}

.brand-text {
  font-family: "Inter-Bold", monospace;
  font-size: 20px;
  color: var(--restaurant-primary);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.auth-title {
  font-family: "Inter-Bold", -apple-system, sans-serif;
  font-size: 28px;
  color: var(--restaurant-primary);
  margin: 0 0 4px 0;
}

.auth-subtitle {
  font-family: "Inter-Light", sans-serif;
  font-size: 14px;
  color: var(--restaurant-secondary);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-input {
  width: 100%;
}

.password-requirements {
  padding: 12px 0;
}

.requirements-title {
  font-family: "Inter-Medium", sans-serif;
  font-size: 12px;
  color: var(--restaurant-secondary);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.requirements-list li {
  font-family: "Inter-Light", sans-serif;
  font-size: 13px;
  color: var(--restaurant-secondary);
  transition: color 0.2s;
}

.requirements-list li.requirement-met {
  color: var(--restaurant-success);
}

.auth-alert {
  border-radius: 6px;
}

.auth-submit {
  font-family: "Inter-Bold", sans-serif;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--restaurant-border);
}

.auth-link {
  font-family: "Inter-Medium", sans-serif;
  font-size: 13px;
  color: var(--restaurant-accent);
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>

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
const submitting = ref(false);

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
  if (submitting.value) return;
  submitting.value = true;
  isSuccessful.value = false;
  validationErrors.value = null;
  generalError.value = null;

  if (!registrationEnabled.value) {
    generalError.value = "Registration is currently disabled!";
    submitting.value = false;
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
  } finally {
    submitting.value = false;
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
            :disabled="!registrationEnabled || !allRequirementsMet || submitting"
            class="auth-submit"
          >
            {{ submitting ? "Creating account..." : "Register" }}
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
  padding: var(--space-6) var(--space-4);
  background: linear-gradient(
    135deg,
    var(--background-warm) 0%,
    var(--neutral-100) 100%
  );
  position: relative;
  overflow: hidden;
}

.auth-wrapper::before {
  content: "";
  position: absolute;
  top: -40%;
  right: -25%;
  width: 700px;
  height: 700px;
  background: radial-gradient(
    circle,
    rgba(217, 119, 6, 0.08) 0%,
    transparent 65%
  );
  border-radius: 50%;
  pointer-events: none;
}

.auth-wrapper::after {
  content: "";
  position: absolute;
  bottom: -35%;
  left: -15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(
    circle,
    rgba(180, 83, 9, 0.06) 0%,
    transparent 65%
  );
  border-radius: 50%;
  pointer-events: none;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xl);
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(1.25);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  padding: var(--space-2) var(--space-4);
  background: var(--brand-50);
  border: 1px solid var(--brand-200);
  border-radius: var(--radius-full);
}

.brand-icon {
  font-size: 20px;
}

.brand-text {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--brand-800);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.auth-title {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  color: var(--ink);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: var(--tracking-tight);
  font-weight: 700;
}

.auth-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-muted);
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.auth-input {
  width: 100%;
}

.password-requirements {
  padding: var(--space-3) 0;
}

.requirements-title {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--ink-secondary);
  margin: 0 0 var(--space-2) 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.requirements-list li {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--ink-secondary);
  transition: color var(--duration-fast) var(--ease-in-out);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.requirements-list li.requirement-met {
  color: var(--earth-600);
}

.auth-alert {
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
}

.auth-submit {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  margin-top: var(--space-2);
  height: 48px;
  border-radius: var(--radius-md);
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-subtle);
}

.auth-link {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}
.auth-link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}
</style>

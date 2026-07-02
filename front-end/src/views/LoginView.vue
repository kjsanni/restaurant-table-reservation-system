<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { VaButton, VaCard, VaCardContent, VaInput, VaAlert } from "vuestic-ui";

import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  email: "",
  password: "",
});

const validationErrors = ref<Record<string, string[]> | null>(null);
const generalError = ref<string | null>(null);
const lockoutRemaining = ref(0);
const lockoutTimer = ref<number | null>(null);

const formatLockoutTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const startLockoutTimer = (remainingSeconds: number) => {
  lockoutRemaining.value = remainingSeconds;
  if (lockoutTimer.value) clearInterval(lockoutTimer.value);
  lockoutTimer.value = window.setInterval(() => {
    lockoutRemaining.value--;
    if (lockoutRemaining.value <= 0) {
      clearInterval(lockoutTimer.value);
      lockoutTimer.value = null;
    }
  }, 1000);
};

const handleLogin = async () => {
  validationErrors.value = null;
  generalError.value = null;
  try {
    await authStore.login(credentials.value.email, credentials.value.password);
    router.push("/reservations");
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
    if (err?.response?.data?.remainingSeconds) {
      startLockoutTimer(err.response.data.remainingSeconds);
    }
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
          <h1 class="auth-title">Sign In</h1>
          <p class="auth-subtitle">Access your restaurant dashboard</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <VaInput
            v-model="credentials.email"
            label="Email"
            type="email"
            :error-messages="validationErrors?.email"
            class="auth-input"
            autocomplete="email"
          />
          <VaInput
            v-model="credentials.password"
            label="Password"
            type="password"
            :error-messages="validationErrors?.password"
            class="auth-input"
            autocomplete="current-password"
          />

          <VaAlert
            v-if="lockoutRemaining > 0"
            color="warning"
            class="auth-alert"
          >
            <span class="lockout-text">
              Account locked. Try again in
              {{ formatLockoutTime(lockoutRemaining) }}
            </span>
          </VaAlert>

          <VaAlert v-if="generalError" color="danger" class="auth-alert">
            {{ generalError }}
          </VaAlert>

          <VaButton
            type="submit"
            preset="primary"
            size="large"
            block
            class="auth-submit"
          >
            Sign In
          </VaButton>
        </form>

        <div class="auth-footer">
          <RouterLink to="/register" class="auth-link"
            >Create account</RouterLink
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

.auth-alert {
  border-radius: 6px;
}

.lockout-text {
  font-family: "Inter-Medium", sans-serif;
  font-size: 13px;
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

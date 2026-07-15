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
  padding: var(--space-6) var(--space-4);
  background: linear-gradient(
    135deg,
    var(--restaurant-cream) 0%,
    var(--restaurant-stone) 100%
  );
  position: relative;
  overflow: hidden;
}

.auth-wrapper::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -30%;
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(251, 191, 36, 0.06) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
}

.auth-wrapper::after {
  content: "";
  position: absolute;
  bottom: -40%;
  left: -20%;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle,
    rgba(220, 38, 38, 0.04) 0%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--restaurant-border);
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
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
  background: var(--color-primary-50);
  border-radius: var(--radius-full);
}

.brand-icon {
  font-size: 20px;
}

.brand-text {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--restaurant-charcoal);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.auth-title {
  font-family: var(--font-serif);
  font-size: var(--text-3xl);
  color: var(--restaurant-charcoal);
  margin: 0 0 var(--space-2) 0;
  letter-spacing: var(--tracking-tight);
}

.auth-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--restaurant-secondary);
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

.auth-alert {
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
}

.lockout-text {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
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
  border-top: 1px solid var(--restaurant-border);
}

.auth-link {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--restaurant-accent);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-in-out);
}
.auth-link:hover {
  color: var(--restaurant-golden);
  text-decoration: underline;
}
</style>

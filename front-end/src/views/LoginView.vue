<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";

const router = useRouter();
const authStore = useAuthStore();

const credentials = ref({
  email: "",
  password: "",
});
const submitting = ref(false);

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
  if (lockoutTimer.value)
    clearInterval(
      lockoutTimer.value as unknown as ReturnType<typeof setInterval>
    );
  const timerId = window.setInterval(() => {
    lockoutRemaining.value--;
    if (lockoutRemaining.value <= 0) {
      clearInterval(timerId);
      lockoutTimer.value = null;
    }
  }, 1000);
  lockoutTimer.value = timerId as unknown as number;
};

const handleLogin = async () => {
  if (submitting.value) return;
  submitting.value = true;
  validationErrors.value = null;
  generalError.value = null;
  try {
    await authStore.login(credentials.value.email, credentials.value.password);
    router.push("/dashboard");
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
    const error = err as {
      response?: { data?: { remainingSeconds?: number } };
    };
    if (error.response?.data?.remainingSeconds) {
      startLockoutTimer(error.response.data.remainingSeconds);
    }
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="page">
    <aside class="brand-side">
      <div class="brand-top">
        <div class="brand-mark">R</div>
        <div class="brand-name">Restaurant Reservations</div>
      </div>
      <div class="brand-center">
        <h1>Run your floor<br />with clarity.</h1>
        <p>
          Reservations, tables, schedule, and guest history — one calm, fast
          workspace for your team.
        </p>
      </div>
      <div class="brand-bottom">© 2026 Vibespot Technologies Ltd</div>
    </aside>

    <main class="form-side">
      <div class="form-card">
        <h2>Welcome back</h2>
        <p class="subtitle">Sign in to your restaurant dashboard</p>
        <form @submit.prevent="handleLogin">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              placeholder="you@restaurant.com"
              autocomplete="email"
            />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <div v-if="lockoutRemaining > 0" class="alert alert-warning">
            Account locked. Try again in
            {{ formatLockoutTime(lockoutRemaining) }}
          </div>

          <div v-if="generalError" class="alert alert-danger">
            {{ generalError }}
          </div>

          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? "Signing in..." : "Sign In" }}
            </button>
            <RouterLink to="/register" class="link">Create account</RouterLink>
          </div>
        </form>
        <div class="footer-note">Restaurant Reservations — vibespotgh.com</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.brand-side {
  background: linear-gradient(
    160deg,
    var(--brand-900) 0%,
    var(--brand-700) 55%,
    var(--brand-600) 100%
  );
  color: var(--white);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px 64px;
  position: relative;
  overflow: hidden;
}
.brand-side::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
      420px 220px at 0% 0%,
      rgba(251, 191, 36, 0.18),
      transparent 60%
    ),
    radial-gradient(
      360px 180px at 100% 100%,
      rgba(217, 119, 6, 0.18),
      transparent 60%
    );
  pointer-events: none;
}
.brand-top {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  animation: fadeDown 0.7s ease-out both;
}
.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 18px;
  color: var(--brand-900);
  box-shadow: 0 10px 30px rgba(217, 119, 6, 0.25);
}
.brand-name {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.brand-center {
  position: relative;
  animation: fadeUp 0.8s 0.1s ease-out both;
}
.brand-center h1 {
  font-family: var(--font-serif);
  font-size: 46px;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
  color: var(--white);
}
.brand-center p {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
  max-width: 420px;
}
.brand-bottom {
  position: relative;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  animation: fadeUp 0.8s 0.25s ease-out both;
}

.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  animation: fadeIn 0.7s 0.15s ease-out both;
}
.form-card {
  width: 100%;
  max-width: 420px;
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: 0 20px 60px rgba(26, 20, 16, 0.08),
    0 1px 2px rgba(26, 20, 16, 0.04);
}
.form-card h2 {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: 6px;
}
.subtitle {
  font-size: 14px;
  color: var(--neutral-600);
  margin-bottom: 28px;
}
.field {
  margin-bottom: 18px;
}
.field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-800);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.field input {
  width: 100%;
  padding: 13px 16px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-900);
  background: var(--neutral-50);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.field input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
}
.btn-primary {
  flex: 1;
  padding: 13px 18px;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(74, 53, 43, 0.25);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.link {
  font-size: 13px;
  color: var(--accent-600);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}
.link:hover {
  color: var(--accent-500);
}
.alert {
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  margin-bottom: 12px;
}
.alert-warning {
  background: var(--accent-100);
  color: var(--accent-600);
}
.alert-danger {
  background: var(--rose-100);
  color: var(--rose-600);
}
.footer-note {
  margin-top: 22px;
  font-size: 13px;
  color: var(--neutral-600);
  text-align: center;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 860px) {
  .page {
    grid-template-columns: 1fr;
  }
  .brand-side {
    display: none;
  }
  .form-side {
    padding: 24px;
  }
}
</style>

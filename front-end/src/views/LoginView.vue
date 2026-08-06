<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { RouterLink } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import TurnstileWidget from "@/components/TurnstileWidget.vue";
import { useTurnstileConfig } from "@/composables/useTurnstileConfig";

const { config: turnstileConfig } = useTurnstileConfig();

const props = defineProps<{ mode?: string }>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const resolvedMode = computed(
  () => props.mode || (route.query.mode as string) || "tenant"
);

const brandName = computed(() =>
  resolvedMode.value === "super-admin"
    ? "Platform Admin"
    : "Restaurant Reservations"
);
const brandHeading = computed(() =>
  resolvedMode.value === "super-admin"
    ? "Platform administration."
    : "Run your floor with clarity."
);
const brandSubtitle = computed(() =>
  resolvedMode.value === "super-admin"
    ? "Manage tenants, billing, and platform health."
    : "Reservations, tables, schedule, and guest history — one calm, fast workspace for your team."
);
const formTitle = computed(() =>
  resolvedMode.value === "super-admin" ? "Platform sign in" : "Welcome back"
);
const formSubtitle = computed(() =>
  resolvedMode.value === "super-admin"
    ? "Super admin access only."
    : "Sign in to your restaurant dashboard"
);

const credentials = ref({
  email: "",
  password: "",
});
const totpToken = ref("");
const submitting = ref(false);
const pendingTOTP = ref(false);
const tempToken = ref("");
const cfTurnstileToken = ref("");

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
    const response = await authStore.login(
      credentials.value.email,
      credentials.value.password,
      resolvedMode.value === "super-admin" ? "platform" : "tenant",
      cfTurnstileToken.value || undefined
    );

    if (response?.pendingTOTP) {
      pendingTOTP.value = true;
      tempToken.value = response.tempToken || "";
      submitting.value = false;
      return;
    }

    if (resolvedMode.value === "super-admin") {
      router.push("/super-admin/overview");
    } else if (resolvedMode.value === "tenant") {
      router.push("/dashboard");
    } else {
      router.push("/dashboard");
    }
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

const handleTOTPLogin = async () => {
  if (submitting.value) return;
  submitting.value = true;
  validationErrors.value = null;
  generalError.value = null;
  try {
    await authStore.loginWithTOTP(tempToken.value, totpToken.value);
    if (resolvedMode.value === "super-admin") {
      router.push("/super-admin/overview");
    } else {
      router.push("/dashboard");
    }
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="page">
    <aside class="brand-side">
      <div class="orb orb-1" aria-hidden="true"></div>
      <div class="orb orb-2" aria-hidden="true"></div>
      <div class="brand-top">
        <div class="brand-mark">R</div>
        <div class="brand-name">{{ brandName }}</div>
      </div>
      <div class="brand-center">
        <h1>{{ brandHeading }}</h1>
        <p>{{ brandSubtitle }}</p>
      </div>
      <div class="brand-bottom">© 2026 Vibespot Technologies Ltd</div>
    </aside>

    <main id="main-content" class="form-side">
      <div class="form-card">
        <h2>{{ formTitle }}</h2>
        <p class="subtitle">{{ formSubtitle }}</p>
        <form v-if="!pendingTOTP" @submit.prevent="handleLogin">
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

          <TurnstileWidget
            v-if="turnstileConfig.enabled && turnstileConfig.siteKey"
            v-model="cfTurnstileToken"
            :site-key="turnstileConfig.siteKey"
          />

          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? "Signing in..." : "Sign In" }}
            </button>
            <RouterLink to="/register" class="link">Create account</RouterLink>
          </div>
        </form>

        <form v-else @submit.prevent="handleTOTPLogin">
          <div class="field">
            <label for="totp">Authenticator code</label>
            <input
              id="totp"
              v-model="totpToken"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123456"
              maxlength="6"
            />
          </div>

          <div v-if="generalError" class="alert alert-danger">
            {{ generalError }}
          </div>

          <div class="actions">
            <button
              type="submit"
              class="btn-primary"
              :disabled="submitting || !totpToken"
            >
              {{ submitting ? "Verifying..." : "Verify" }}
            </button>
            <button
              type="button"
              class="link"
              @click="
                pendingTOTP = false;
                tempToken = '';
              "
            >
              Cancel
            </button>
          </div>
        </form>
        <div class="footer-note">Restaurant Reservations — vibespotgh.com</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
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
  background:
    radial-gradient(
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

.brand-side::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
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
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 18px;
  color: var(--white);
}

.brand-center p {
  font-family: var(--font-sans);
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

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.4;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: var(--accent-400);
  top: -80px;
  right: -60px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 240px;
  height: 240px;
  background: var(--brand-400);
  bottom: -40px;
  left: -40px;
  animation: float 10s 2s ease-in-out infinite;
}

.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  background:
    radial-gradient(
      ellipse at 30% 20%,
      rgba(217, 119, 6, 0.04) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 70% 80%,
      rgba(180, 83, 9, 0.03) 0%,
      transparent 50%
    ),
    var(--background);
  animation: fadeIn 0.7s 0.15s ease-out both;
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow:
    0 20px 60px rgba(26, 20, 16, 0.08),
    0 1px 2px rgba(26, 20, 16, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  position: relative;
}

@supports (backdrop-filter: blur(1px)) {
  .form-card {
    backdrop-filter: blur(24px) saturate(1.4);
    -webkit-backdrop-filter: blur(24px) saturate(1.4);
    will-change: transform;
  }
}

.form-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.015;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.form-card h2 {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: 6px;
}

.subtitle {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--neutral-600);
  margin-bottom: 28px;
}

.field {
  margin-bottom: 18px;
  animation: fadeUp 0.5s ease-out both;
}

.field:nth-child(1) {
  animation-delay: 0.15s;
}
.field:nth-child(2) {
  animation-delay: 0.25s;
}
.field:nth-child(3) {
  animation-delay: 0.35s;
}
.field:nth-child(4) {
  animation-delay: 0.45s;
}

.field label {
  display: block;
  font-family: var(--font-sans);
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.field input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
  background: rgba(255, 255, 255, 0.95);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  gap: 16px;
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
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.btn-primary::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-primary:hover:not(:disabled)::after {
  opacity: 1;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(74, 53, 43, 0.25);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--accent-600);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--duration-fast) var(--ease-in-out);
  white-space: nowrap;
}

.link:hover {
  color: var(--accent-500);
}

.alert {
  padding: 12px;
  border-radius: var(--radius-lg);
  font-family: var(--font-sans);
  font-size: 13px;
  margin-bottom: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.alert-warning {
  background: var(--accent-100);
  color: var(--accent-600);
  border: 1px solid rgba(217, 119, 6, 0.15);
}

.alert-danger {
  background: var(--rose-100);
  color: var(--rose-600);
  border: 1px solid rgba(225, 29, 72, 0.15);
}

.footer-note {
  margin-top: 22px;
  font-family: var(--font-sans);
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

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(12px, -12px);
  }
  66% {
    transform: translate(-8px, 8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
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
  .form-card {
    padding: 28px;
  }
}
</style>

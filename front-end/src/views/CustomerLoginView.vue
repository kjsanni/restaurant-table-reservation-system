<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage, getApiErrors } from "@/utils/apiError";
import TurnstileWidget from "@/components/TurnstileWidget.vue";
import { useTurnstileConfig } from "@/composables/useTurnstileConfig";

const { config: turnstileConfig } = useTurnstileConfig();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const credentials = ref({
  email: "",
  password: "",
});
const submitting = ref(false);
const generalError = ref<string | null>(null);
const validationErrors = ref<Record<string, string[]> | null>(null);
const cfTurnstileToken = ref("");

const onTurnstileSuccess = (token: string) => {
  cfTurnstileToken.value = token;
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
      "tenant",
      cfTurnstileToken.value || undefined
    );

    const redirect = (route.query.redirect as string) || "/portal";
    router.push(redirect);
  } catch (err) {
    generalError.value = getApiErrorMessage(err);
    validationErrors.value = getApiErrors(err);
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="page">
    <aside class="brand-side">
      <div class="orb orb-1" aria-hidden="true"></div>
      <div class="orb orb-2" aria-hidden="true"></div>
      <div class="brand-top">
        <div class="brand-mark">R</div>
        <div class="brand-name">Customer Portal</div>
      </div>
      <div class="brand-center">
        <h1>Welcome back.</h1>
        <p>Sign in to manage your reservations, orders, and preferences.</p>
      </div>
      <div class="brand-bottom">&copy; 2026 Vibespot Technologies Ltd</div>
    </aside>

    <main class="form-side">
      <div class="form-card">
        <h2>Sign in</h2>
        <p class="form-subtitle">Welcome back to your account</p>

        <div v-if="generalError" class="alert alert-error">
          {{ generalError }}
        </div>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              autocomplete="email"
              required
              :aria-invalid="!!validationErrors?.email"
              :aria-describedby="
                validationErrors?.email ? 'email-error' : undefined
              "
            />
            <span
              v-if="validationErrors?.email"
              id="email-error"
              class="error"
              role="alert"
              >{{ validationErrors.email[0] }}</span
            >
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              autocomplete="current-password"
              required
              :aria-invalid="!!validationErrors?.password"
              :aria-describedby="
                validationErrors?.password ? 'password-error' : undefined
              "
            />
            <span
              v-if="validationErrors?.password"
              id="password-error"
              class="error"
              role="alert"
              >{{ validationErrors.password[0] }}</span
            >
          </div>

          <div v-if="turnstileConfig?.enabled" class="field">
            <TurnstileWidget @success="onTurnstileSuccess" />
          </div>

          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? "Signing in..." : "Sign in" }}
          </button>
        </form>

        <p class="form-footer">
          Don't have an account?
          <RouterLink to="/customer/register">Create one</RouterLink>
          <span class="sep">·</span>
          <RouterLink to="/forgot-password">Forgot password?</RouterLink>
        </p>
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
  padding: 2.5rem;
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
  gap: 0.75rem;
  animation: fadeDown 0.7s ease-out both;
}

.brand-mark {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  color: var(--brand-900);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-family: var(--font-serif);
  box-shadow: 0 10px 30px rgba(217, 119, 6, 0.25);
}

.brand-name {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
}

.brand-center {
  position: relative;
  animation: fadeUp 0.8s 0.1s ease-out both;
}

.brand-center h1 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.5rem);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem;
  color: var(--white);
}

.brand-center p {
  font-family: var(--font-sans);
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.05rem;
  line-height: 1.5;
  max-width: 28rem;
}

.brand-bottom {
  position: relative;
  font-size: 0.875rem;
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
  flex: 1;
  display: grid;
  place-items: center;
  padding: 2rem;
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
  max-width: 24rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  padding: 2rem;
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
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neutral-900);
}

.form-subtitle {
  font-family: var(--font-sans);
  color: var(--neutral-600);
  margin: 0 0 1.5rem;
}

.field {
  margin-bottom: 1rem;
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
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--neutral-800);
}

.field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 0.95rem;
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

.error {
  color: var(--rose-600);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.alert {
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.alert-error {
  background: var(--rose-100);
  color: #991b1b;
  border: 1px solid rgba(225, 29, 72, 0.15);
}

.btn-primary {
  width: 100%;
  padding: 0.7rem;
  background: linear-gradient(135deg, var(--brand-700), var(--brand-600));
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 700;
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
  opacity: 0.7;
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  color: var(--neutral-600);
}

.sep {
  margin: 0 0.5rem;
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
    padding: 1.5rem;
  }
}
</style>

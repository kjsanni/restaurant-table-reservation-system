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
              required
            />
            <span v-if="validationErrors?.email" class="error">{{
              validationErrors.email[0]
            }}</span>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
            />
            <span v-if="validationErrors?.password" class="error">{{
              validationErrors.password[0]
            }}</span>
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
  display: flex;
  min-height: 100vh;
}
.brand-side {
  flex: 1;
  background: #0f172a;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2.5rem;
}
.brand-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.brand-mark {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #38bdf8;
  color: #0f172a;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.brand-name {
  font-size: 1.25rem;
  font-weight: 600;
}
.brand-center h1 {
  font-size: 2.5rem;
  line-height: 1.1;
  margin: 0 0 0.75rem;
}
.brand-center p {
  color: #94a3b8;
  font-size: 1.05rem;
  line-height: 1.5;
  max-width: 28rem;
}
.brand-bottom {
  color: #64748b;
  font-size: 0.875rem;
}
.form-side {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: #f8fafc;
}
.form-card {
  width: 100%;
  max-width: 24rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
}
.form-card h2 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}
.form-subtitle {
  color: #64748b;
  margin: 0 0 1.5rem;
}
.field {
  margin-bottom: 1rem;
}
.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: #334155;
}
.field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  font-size: 0.95rem;
}
.field input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
}
.error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}
.alert {
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.btn-primary {
  width: 100%;
  padding: 0.7rem;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.form-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: #475569;
}
.sep {
  margin: 0 0.5rem;
}
</style>

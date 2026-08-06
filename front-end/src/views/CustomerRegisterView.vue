<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage } from "@/utils/apiError";
import TurnstileWidget from "@/components/TurnstileWidget.vue";
import { useTurnstileConfig } from "@/composables/useTurnstileConfig";
import { getBySlug as getPublicTenant } from "@/services/tenantPublicAPI";

const { config: turnstileConfig } = useTurnstileConfig();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});
const submitting = ref(false);
const generalError = ref<string | null>(null);
const validationErrors = ref<Record<string, string[]> | null>(null);
const cfTurnstileToken = ref("");
const tenantSlug = ref<string>((route.params.tenantSlug as string) || "");
const tenantBranding = ref<{
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}>({});
const loadingBranding = ref(false);

const brandSideStyle = computed(() => ({
  background: tenantBranding.value.primaryColor || "#0f172a",
}));

const applyBrandingToDOM = (branding: Record<string, any>) => {
  const root = document.documentElement;
  if (branding.primaryColor) {
    root.style.setProperty("--brand-500", branding.primaryColor);
    root.style.setProperty("--brand-400", branding.primaryColor);
    root.style.setProperty("--brand-600", branding.primaryColor);
    root.style.setProperty("--brand-700", branding.primaryColor);
    root.style.setProperty("--accent", branding.primaryColor);
    root.style.setProperty("--accent-500", branding.primaryColor);
    root.style.setProperty("--accent-400", branding.primaryColor);
    root.style.setProperty("--accent-600", branding.primaryColor);
    root.style.setProperty("--accent-soft", branding.primaryColor);
    root.style.setProperty("--accent-text", branding.primaryColor);
  }
  if (branding.secondaryColor) {
    root.style.setProperty("--brand-900", branding.secondaryColor);
    root.style.setProperty("--brand-800", branding.secondaryColor);
  }
};

const loadTenantBranding = async () => {
  if (!tenantSlug.value) return;
  loadingBranding.value = true;
  try {
    const response = await getPublicTenant(tenantSlug.value);
    const settings = response.data?.item?.settings || {};
    tenantBranding.value = settings.branding || {};
    applyBrandingToDOM(tenantBranding.value);
  } catch {
    tenantBranding.value = {};
  } finally {
    loadingBranding.value = false;
  }
};

const onTurnstileSuccess = (token: string) => {
  cfTurnstileToken.value = token;
};

onMounted(() => {
  loadTenantBranding();
});

const handleRegister = async () => {
  if (submitting.value) return;
  submitting.value = true;
  validationErrors.value = null;
  generalError.value = null;

  if (form.value.password !== form.value.confirmPassword) {
    generalError.value = "Passwords do not match.";
    submitting.value = false;
    return;
  }

  try {
    await authStore.customerRegister(
      form.value.email,
      form.value.password,
      form.value.firstName,
      form.value.lastName,
      form.value.phone,
      cfTurnstileToken.value || undefined,
      tenantSlug.value || undefined
    );
    router.push("/portal");
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
    <aside class="brand-side" :style="brandSideStyle">
      <div class="brand-top">
        <div class="brand-mark" v-if="!tenantBranding.logoUrl">R</div>
        <img
          v-else
          :src="tenantBranding.logoUrl"
          class="brand-logo"
          alt="Tenant logo"
        />
        <div class="brand-name">
          {{ tenantBranding.brandName || "Customer Portal" }}
        </div>
      </div>
      <div class="brand-center">
        <h1>Join us today.</h1>
        <p>Create an account to manage your reservations and preferences.</p>
      </div>
      <div class="brand-bottom" v-if="tenantSlug">
        &copy; 2026 {{ tenantBranding.brandName || "Tenant" }}
      </div>
      <div class="brand-bottom" v-else>
        &copy; 2026 Vibespot Technologies Ltd
      </div>
    </aside>

    <main class="form-side">
      <div class="form-card">
        <h2>Create your account</h2>
        <p class="form-subtitle">Get started in seconds</p>

        <div v-if="generalError" class="alert alert-error">
          {{ generalError }}
        </div>

        <form @submit.prevent="handleRegister">
          <div class="row">
            <div class="field">
              <label for="firstName">First name</label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                required
              />
              <span v-if="validationErrors?.firstName" class="error">{{
                validationErrors.firstName[0]
              }}</span>
            </div>
            <div class="field">
              <label for="lastName">Last name</label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                required
              />
              <span v-if="validationErrors?.lastName" class="error">{{
                validationErrors.lastName[0]
              }}</span>
            </div>
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" v-model="form.email" type="email" required />
            <span v-if="validationErrors?.email" class="error">{{
              validationErrors.email[0]
            }}</span>
          </div>

          <div class="field">
            <label for="phone">Phone</label>
            <input id="phone" v-model="form.phone" type="tel" required />
            <span v-if="validationErrors?.phone" class="error">{{
              validationErrors.phone[0]
            }}</span>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
            />
            <span v-if="validationErrors?.password" class="error">{{
              validationErrors.password[0]
            }}</span>
          </div>

          <div class="field">
            <label for="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              minlength="8"
            />
          </div>

          <div v-if="turnstileConfig?.enabled" class="field">
            <TurnstileWidget @success="onTurnstileSuccess" />
          </div>

          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? "Creating account..." : "Create account" }}
          </button>
        </form>

        <p class="form-footer">
          Already have an account?
          <RouterLink to="/customer/login">Sign in</RouterLink>
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
  background: var(--brand-900, #0f172a);
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
  background: var(--accent, #38bdf8);
  color: var(--brand-900, #0f172a);
  display: grid;
  place-items: center;
  font-weight: 700;
}
.brand-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  object-fit: contain;
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
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  border-color: var(--accent, #38bdf8);
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
  background: var(--brand-900, #0f172a);
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
</style>

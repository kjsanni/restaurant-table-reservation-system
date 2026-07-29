<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/stores/auth";
import { getApiErrorMessage } from "@/utils/apiError";
import TurnstileWidget from "@/components/TurnstileWidget.vue";
import { useTurnstileConfig } from "@/composables/useTurnstileConfig";

const { config: turnstileConfig } = useTurnstileConfig();

const router = useRouter();
const authStore = useAuthStore();

type BusinessVertical = "restaurant" | "salon";

const RESTAURANT_TYPES = [
  {
    value: "full_service",
    label: "Full Service Restaurant",
    description: "Table service, reservations, floor plan",
  },
  {
    value: "quick_service",
    label: "Quick Service",
    description: "Fast casual, counter service",
  },
  {
    value: "cloud_kitchen",
    label: "Cloud Kitchen",
    description: "Delivery-only, no dine-in",
  },
  {
    value: "cafe",
    label: "Cafe",
    description: "Coffee, light meals, casual seating",
  },
  {
    value: "bar",
    label: "Bar / Lounge",
    description: "Drinks, bar seating, light bites",
  },
];

const SERVICE_MODES = [
  {
    value: "dine_in",
    label: "Dine-In",
    description: "Table reservations and floor plan",
  },
  {
    value: "takeaway",
    label: "Takeaway",
    description: "Order ahead, pick up in store",
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Driver dispatch and tracking",
  },
];

const PLANS = [
  { slug: "starter", name: "Starter", price: 299 },
  { slug: "growth", name: "Growth", price: 599 },
  { slug: "scale", name: "Scale", price: 999 },
];

const form = ref({
  businessName: "",
  slug: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessVertical: "restaurant" as BusinessVertical,
  restaurantType: "full_service",
  serviceModes: ["dine_in", "takeaway", "delivery"] as string[],
  planSlug: "starter",
});
const submitting = ref(false);
const generalError = ref<string | null>(null);
const validationErrors = ref<Record<string, string[]> | null>(null);
const cfTurnstileToken = ref("");

const vertical = computed(() => form.value.businessVertical);
const selectedPlan = computed(
  () => PLANS.find((p) => p.slug === form.value.planSlug) || PLANS[0]
);

const onTurnstileSuccess = (token: string) => {
  cfTurnstileToken.value = token;
};

const generateSlug = () => {
  form.value.slug = form.value.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
};

const toggleServiceMode = (mode: string) => {
  const idx = form.value.serviceModes.indexOf(mode);
  if (idx >= 0) {
    form.value.serviceModes.splice(idx, 1);
  } else {
    form.value.serviceModes.push(mode);
  }
};

const handleSignup = async () => {
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
    const response = await fetch("/api/v1/public/tenants/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.value.businessName,
        slug: form.value.slug,
        email: form.value.email,
        password: form.value.password,
        businessVertical: form.value.businessVertical,
        restaurantType: form.value.restaurantType,
        serviceModes: form.value.serviceModes,
        planSlug: form.value.planSlug,
        cfTurnstileToken: cfTurnstileToken.value || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw data;
    }

    if (data.user) {
      authStore.user = data.user;
      authStore.isAuthenticated = true;
    }

    router.push("/dashboard");
  } catch (err: any) {
    generalError.value = err?.message || "Signup failed. Please try again.";
    validationErrors.value = err?.errors || null;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="signup-root">
    <nav class="signup-nav">
      <div class="nav-inner">
        <div class="nav-brand" @click="router.push('/')">
          <Icon icon="mdi:silverware-fork-knife" width="28" height="28" />
          <span>Vibespot</span>
        </div>
        <div class="nav-actions">
          <button class="nav-link" @click="router.push('/pricing')">
            Pricing
          </button>
          <button class="nav-link" @click="router.push('/customer/login')">
            Login
          </button>
        </div>
      </div>
    </nav>

    <main class="signup-main">
      <div class="signup-card">
        <div class="signup-header">
          <h1>Start your free trial</h1>
          <p>Set up your restaurant or salon in minutes.</p>
        </div>

        <div v-if="generalError" class="alert alert-error">
          {{ generalError }}
        </div>

        <form @submit.prevent="handleSignup" class="signup-form">
          <div class="form-row">
            <div class="field">
              <label for="businessName">Business name</label>
              <input
                id="businessName"
                v-model="form.businessName"
                type="text"
                required
                @blur="generateSlug"
              />
            </div>
            <div class="field">
              <label for="slug">Subdomain</label>
              <div class="slug-input">
                <input
                  id="slug"
                  v-model="form.slug"
                  type="text"
                  required
                  pattern="[a-z0-9-]+"
                />
                <span class="slug-suffix">.vibespot.com</span>
              </div>
            </div>
          </div>

          <div class="field">
            <label for="email">Admin email</label>
            <input id="email" v-model="form.email" type="email" required />
          </div>

          <div class="form-row">
            <div class="field">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="8"
              />
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
          </div>

          <div class="field">
            <label>Business type</label>
            <div class="vertical-toggle">
              <button
                :class="[
                  'vertical-btn',
                  form.businessVertical === 'restaurant' && 'active',
                ]"
                type="button"
                @click="form.businessVertical = 'restaurant'"
              >
                <Icon icon="mdi:silverware-fork-knife" width="20" />
                Restaurant
              </button>
              <button
                :class="[
                  'vertical-btn',
                  form.businessVertical === 'salon' && 'active',
                ]"
                type="button"
                @click="form.businessVertical = 'salon'"
              >
                <Icon icon="mdi:content-cut" width="20" />
                Salon
              </button>
            </div>
          </div>

          <div v-if="vertical === 'restaurant'" class="field">
            <label for="restaurantType">Restaurant type</label>
            <select id="restaurantType" v-model="form.restaurantType">
              <option
                v-for="type in RESTAURANT_TYPES"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>Service modes</label>
            <div class="modes-grid">
              <button
                v-for="mode in SERVICE_MODES"
                :key="mode.value"
                :class="[
                  'mode-chip',
                  form.serviceModes.includes(mode.value) && 'active',
                ]"
                type="button"
                @click="toggleServiceMode(mode.value)"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="field">
            <label>Plan</label>
            <div class="plans-grid">
              <div
                v-for="plan in PLANS"
                :key="plan.slug"
                :class="[
                  'plan-option',
                  form.planSlug === plan.slug && 'active',
                ]"
                @click="form.planSlug = plan.slug"
              >
                <div class="plan-option-name">{{ plan.name }}</div>
                <div class="plan-option-price">
                  GHS {{ plan.price.toLocaleString() }}/mo
                </div>
              </div>
            </div>
          </div>

          <div v-if="turnstileConfig?.enabled" class="field">
            <TurnstileWidget @success="onTurnstileSuccess" />
          </div>

          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? "Creating your workspace..." : "Start free trial" }}
          </button>
        </form>

        <p class="signup-footer">
          Already have an account?
          <RouterLink to="/customer/login">Sign in</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.signup-root {
  min-height: 100vh;
  background: #faf9f7;
  color: #312e2a;
}
.signup-nav {
  background: #ffffff;
  border-bottom: 1px solid #e7e4de;
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  color: #1a1410;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.nav-link {
  background: transparent;
  border: none;
  color: #4a4540;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: 0.4rem;
}
.nav-link:hover {
  background: #f3f1ed;
}
.signup-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}
.signup-card {
  background: #ffffff;
  border: 1px solid #e7e4de;
  border-radius: 0.75rem;
  padding: 2rem;
}
.signup-header {
  margin-bottom: 1.5rem;
}
.signup-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.6rem;
  color: #1a1410;
}
.signup-header p {
  margin: 0;
  color: #645d54;
}
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a4540;
}
.field input,
.field select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #d6d1c9;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  background: #fff;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
}
.slug-input {
  display: flex;
  align-items: center;
  border: 1px solid #d6d1c9;
  border-radius: 0.5rem;
  overflow: hidden;
}
.slug-input input {
  border: none;
  border-radius: 0;
}
.slug-input input:focus {
  box-shadow: none;
}
.slug-suffix {
  background: #f3f1ed;
  color: #7d766c;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  border-left: 1px solid #d6d1c9;
}
.vertical-toggle {
  display: flex;
  gap: 0.75rem;
}
.vertical-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #d6d1c9;
  background: #fff;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #4a4540;
}
.vertical-btn.active {
  border-color: #1a1410;
  background: #1a1410;
  color: #fff;
}
.modes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.mode-chip {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d6d1c9;
  background: #fff;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4a4540;
}
.mode-chip.active {
  background: #1a1410;
  color: #fff;
  border-color: #1a1410;
}
.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.plan-option {
  border: 1px solid #d6d1c9;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}
.plan-option:hover {
  border-color: #1a1410;
}
.plan-option.active {
  border-color: #1a1410;
  background: #1a1410;
  color: #fff;
}
.plan-option-name {
  font-weight: 600;
  font-size: 0.95rem;
}
.plan-option-price {
  font-size: 0.85rem;
  opacity: 0.85;
  margin-top: 0.2rem;
}
.alert {
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}
.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #1a1410;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.signup-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: #475569;
}
</style>
